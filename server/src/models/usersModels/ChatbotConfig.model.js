/**
 * ChatbotConfig — singleton document that stores the AI chatbot configuration.
 *
 * Only one document lives in this collection (enforced by a unique `singleton`
 * field). All admin operations read/update this single record.
 *
 * API keys are stored as an encrypted string (AES-256-GCM via the `crypto`
 * module) using the ENCRYPTION_KEY env variable.  Never expose the raw key.
 */
import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema({
  provider:     { type: String, required: true, trim: true },  // 'claude' | 'openai' | 'gemini' | etc.
  encryptedKey: { type: String, required: true },              // AES-256-GCM encrypted
  label:        { type: String, default: '' },                 // friendly name, e.g. "Production Claude key"
  isActive:     { type: Boolean, default: false },
  addedAt:      { type: Date, default: Date.now },
}, { _id: true });

const chatbotConfigSchema = new mongoose.Schema({
  /** Ensures only one document can exist in this collection. */
  singleton: { type: String, default: 'main', unique: true, immutable: true },

  /** Which AI provider + model is currently active. */
  activeProvider: {
    type:    String,
    enum:    ['anthropic', 'claude', 'openai', 'gemini', 'custom'],
    default: 'anthropic',
  },
  activeModel:  { type: String, default: 'claude-sonnet-4-6',         trim: true },
  /** Cheaper model used automatically for short/simple queries (smart routing). */
  simpleModel:  { type: String, default: 'claude-haiku-4-5-20251001', trim: true },

  /** Stored API key entries (one may be marked active). */
  apiKeys: { type: [apiKeySchema], default: [] },

  /** System prompt injected into every Claude conversation. */
  systemPrompt: {
    type: String,
    default:
      'You are a helpful business assistant for this agency website. ' +
      'Answer questions ONLY about the business, services, projects, team, ' +
      'pricing, and other topics directly related to this company. ' +
      'If a question is off-topic, politely decline and redirect the user to ' +
      'ask about the business.',
  },

  /** Extra free-text context about the business (appended to system prompt). */
  businessContext: { type: String, default: '' },

  /** Chatbot personality name shown in the UI. */
  botName: { type: String, default: 'Nova', trim: true },

  /** Greeting message shown when the chat opens. */
  welcomeMessage: {
    type:    String,
    default: "Hi! I'm Nova, your AI assistant. Ask me anything about our services, projects, or team!",
  },

  /** Whether the chatbot widget is active on the public site. */
  isEnabled: { type: Boolean, default: true },

  /**
   * Conversational tone / personality style injected into the system prompt.
   * Each option maps to a pre-written instruction paragraph in the controller.
   */
  tone: {
    type:    String,
    enum:    ['professional', 'friendly', 'formal', 'casual', 'expert', 'empathetic'],
    default: 'professional',
  },

  /** Claude generation parameters. */
  maxTokens:   { type: Number, default: 1024, min: 256, max: 8192 },
  temperature: { type: Number, default: 0.7,  min: 0,   max: 1 },

  /** Simple rate-limiting hints (enforced at the controller level). */
  maxMessagesPerHour: { type: Number, default: 30 },
  maxMessagesPerDay:  { type: Number, default: 100 },
}, {
  timestamps: true,
});

export default mongoose.model('ChatbotConfig', chatbotConfigSchema);
