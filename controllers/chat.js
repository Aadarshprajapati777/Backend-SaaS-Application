import Chat from '../models/Chat.js';
import AIModel from '../models/AIModel.js';
import Usage from '../models/Usage.js';
import createError from '../utils/errorResponse.js';

/**
 * Mock function to simulate AI response generation
 * In a real app, this would integrate with an actual AI service
 * @param {string} prompt - User message
 * @param {Object} model - AI model data
 * @param {string} language - Response language
 * @returns {Promise<string>} AI generated response
 */
const generateAIResponse = async (prompt, model, language = 'english') => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple responses based on language
  const responses = {
    english: [
      `Based on the documents I've been trained on, I can tell you that ${prompt}`,
      `According to my training data, ${prompt} is related to several key concepts.`,
      `I've analyzed your question about ${prompt} and found some relevant information.`,
      `The documents suggest that ${prompt} has several important aspects to consider.`
    ],
    hindi: [
      `मेरे प्रशिक्षण के अनुसार, ${prompt} के बारे में महत्वपूर्ण जानकारी है।`,
      `${prompt} पर आधारित, मैं आपको कुछ उपयोगी जानकारी दे सकता हूं।`
    ],
    arabic: [
      `بناءً على المستندات التي تدربت عليها، يمكنني إخبارك أن ${prompt}`,
      `وفقًا لبيانات التدريب الخاصة بي، ${prompt} مرتبط بعدة مفاهيم أساسية.`
    ],
    nepali: [
      `मेरो प्रशिक्षण अनुसार, ${prompt} बारे महत्त्वपूर्ण जानकारी छ।`,
      `${prompt} को आधारमा, म तपाईंलाई केही उपयोगी जानकारी दिन सक्छु।`
    ]
  };
  
  // Default to English if language not supported
  const availableResponses = responses[language] || responses.english;
  
  // Randomly select a response template
  const randomIndex = Math.floor(Math.random() * availableResponses.length);
  
  // Calculate mock token count (roughly based on character count)
  const tokenCount = Math.ceil((prompt.length + availableResponses[randomIndex].length) / 4);
  
  return {
    content: availableResponses[randomIndex],
    tokenCount
  };
};

/**
 * @desc    Get all chat sessions
 * @route   GET /api/chat
 * @access  Private
 */
export const getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ user: req.user.id })
      .sort('-createdAt')
      .populate('model', 'name description');

    res.status(200).json({
      success: true,
      count: chats.length,
      data: chats
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single chat session
 * @route   GET /api/chat/:id
 * @access  Private
 */
export const getChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('model', 'name description')
      .populate('user', 'name email');

    if (!chat) {
      return next(createError('Chat not found', 404));
    }

    // Make sure user owns the chat
    if (chat.user._id.toString() !== req.user.id) {
      return next(createError('Not authorized to access this chat', 403));
    }

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create new chat session
 * @route   POST /api/chat
 * @access  Private
 */
export const createChat = async (req, res, next) => {
  try {
    const { modelId, title } = req.body;

    if (!modelId) {
      return next(createError('Please provide a model ID', 400));
    }

    // Verify model exists and user has access
    const model = await AIModel.findById(modelId);
    
    if (!model) {
      return next(createError('Model not found', 404));
    }

    // Check if user owns the model or is a team member with access
    const isOwner = model.user.toString() === req.user.id;
    const isTeamMember = req.user.team && model.team && 
                         model.team.toString() === req.user.team.toString();
    
    if (!isOwner && !isTeamMember) {
      return next(createError('Not authorized to use this model', 403));
    }

    // Create chat session
    const chat = await Chat.create({
      user: req.user.id,
      model: modelId,
      title: title || 'New Chat',
      messages: [] // Start with empty messages
    });

    res.status(201).json({
      success: true,
      data: chat
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Send message to chat
 * @route   POST /api/chat/:id/messages
 * @access  Private
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return next(createError('Please provide a message', 400));
    }

    const chat = await Chat.findById(req.params.id)
      .populate('model');

    if (!chat) {
      return next(createError('Chat not found', 404));
    }

    // Make sure user owns the chat
    if (chat.user.toString() !== req.user.id) {
      return next(createError('Not authorized to send messages in this chat', 403));
    }

    // Add user message to chat
    chat.messages.push({
      role: 'user',
      content
    });

    // In a real application, here you would:
    // 1. Call the AI service (OpenAI, etc.) with the model's parameters and the chat history
    // 2. Get the AI response
    // 3. Record usage metrics
    
    // For now, we'll simulate an AI response
    const aiResponse = await simulateAIResponse(chat.model, content, chat.messages);
    
    // Add AI response to chat
    chat.messages.push({
      role: 'assistant',
      content: aiResponse.message
    });

    // Update chat record
    chat.lastMessage = aiResponse.message;
    chat.updatedAt = Date.now();
    await chat.save();

    // Record usage
    await Usage.create({
      user: req.user.id,
      type: 'chat',
      modelId: chat.model._id,
      chatId: chat._id,
      prompt: content,
      completion: aiResponse.message,
      totalTokens: aiResponse.totalTokens,
      promptTokens: aiResponse.promptTokens,
      completionTokens: aiResponse.completionTokens,
      timestamp: Date.now()
    });

    res.status(200).json({
      success: true,
      data: {
        message: {
          role: 'assistant',
          content: aiResponse.message
        },
        chat
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete chat
 * @route   DELETE /api/chat/:id
 * @access  Private
 */
export const deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return next(createError('Chat not found', 404));
    }

    // Make sure user owns the chat
    if (chat.user.toString() !== req.user.id) {
      return next(createError('Not authorized to delete this chat', 403));
    }

    await chat.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update chat title
 * @route   PUT /api/chat/:id
 * @access  Private
 */
export const updateChat = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title) {
      return next(createError('Please provide a title', 400));
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return next(createError('Chat not found', 404));
    }

    // Make sure user owns the chat
    if (chat.user.toString() !== req.user.id) {
      return next(createError('Not authorized to update this chat', 403));
    }

    chat.title = title;
    await chat.save();

    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Helper function to simulate AI response
 * In a real app, this would call OpenAI API or similar
 */
const simulateAIResponse = async (model, userMessage, chatHistory) => {
  // Mock implementation - in real app, call the AI API
  const promptTokens = Math.ceil(userMessage.length / 4);
  const completionTokens = Math.ceil(userMessage.length / 2);
  
  // Build a response based on model type and user message
  let aiMessage = `This is a simulated response from ${model.name}. `;
  
  if (userMessage.includes('?')) {
    aiMessage += 'Let me answer your question. Based on the documents I was trained on, ';
    aiMessage += 'I would suggest considering multiple factors in your analysis.';
  } else {
    aiMessage += 'I understand your message. Here\'s what I can tell you based on my training: ';
    aiMessage += 'The documents you\'ve provided contain various insights that might be useful.';
  }
  
  // Add some contextual response based on chat history length
  if (chatHistory.length > 4) {
    aiMessage += ' Based on our conversation so far, I think we\'re making good progress in understanding this topic.';
  }
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    message: aiMessage,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens
  };
}; 