/**
 * ChatbotKnowledge — individual knowledge-base entries used to give the AI
 * chatbot context about the business.
 *
 * During a chat request the controller performs a full-text search over the
 * `title` and `content` fields, then injects the top-matching entries into
 * the Claude system prompt as structured context.
 */
import mongoose from 'mongoose';

const chatbotKnowledgeSchema = new mongoose.Schema({
  title:   { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 20000 },

  /**
   * type:
   *  'text' — plain text / markdown snippet added by admin
   *  'faq'  — a question-answer pair
   *  'file' — content extracted from / linked to an uploaded file
   *  'url'  — content crawled from a live website page
   *  'auto' — auto-generated from CMS data (future)
   */
  type: {
    type:    String,
    enum:    ['text', 'faq', 'file', 'url', 'auto'],
    default: 'text',
  },

  /** Cloudinary URL of the source file (type === 'file') or source page URL (type === 'url'). */
  fileUrl:  { type: String, default: '' },
  fileName: { type: String, default: '' },

  /** Original page URL — only set for type === 'url'. */
  sourceUrl: { type: String, default: '' },

  /** Tags for manual categorisation (used in the admin UI filter). */
  tags: { type: [String], default: [] },

  /** Disabled entries are excluded from knowledge retrieval. */
  isActive: { type: Boolean, default: true },

  /** Word count — computed before save for quick display in admin. */
  wordCount: { type: Number, default: 0 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

// Full-text index so we can rank entries by relevance to a user's query.
chatbotKnowledgeSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Auto-compute wordCount before every save.
chatbotKnowledgeSchema.pre('save', async function () {
  if (this.isModified('content')) {
    this.wordCount = this.content.trim().split(/\s+/).filter(Boolean).length;
  }
});

export default mongoose.model('ChatbotKnowledge', chatbotKnowledgeSchema);
