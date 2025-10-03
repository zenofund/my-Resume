# easyIA - AI-Powered Legal Assistant

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue)](https://your-domain.com)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB)](https://reactjs.org/)
[![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E)](https://supabase.com/)
[![Styled with Tailwind](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-38B2AC)](https://tailwindcss.com/)

Transform your legal research with AI-powered document analysis and chat interface. Get instant access to Nigerian case law, statutes, and legal precedents.

![easyIA Dashboard](https://images.pexels.com/photos/5668882/pexels-photo-5668882.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop)

## ✨ Features

### 🤖 AI-Powered Legal Chat
- **OpenAI Integration**: Advanced GPT-4 powered legal research assistant
- **RAG Pipeline**: Upload and chat with Nigerian legal documents
- **Smart Citations**: Automatic case law citations with clickable metadata
- **Chat Sessions**: Persistent conversations with memory

### 💼 Subscription Tiers
- **Free Tier**: Basic chat functionality and document upload
- **Pro Tier**: Internet search, citation generator, case summarizer
- **Enterprise Tier**: Team collaboration, AI drafting, analytics dashboard

### 👨‍💼 Admin Dashboard
- **User Management**: View and manage all platform users
- **Document Management**: Upload and organize legal documents
- **Subscription Management**: Handle billing and plan changes
- **Analytics**: Track platform usage and performance

## 🚀 Live Demo

Visit the live application: [https://your-domain.com](https://your-domain.com)

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Vite** - Fast build tool and development server
- **Lucide React** - Beautiful icon library

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Row Level Security** - Secure data access policies
- **Real-time subscriptions** - Live data updates
- **Authentication** - Built-in user management with role-based access

### AI & Payments
- **OpenAI GPT-4** - Advanced language model for legal analysis
- **Vector Embeddings** - Document similarity search
- **Paystack** - Payment processing with split payments
- **RAG Pipeline** - Retrieval-Augmented Generation for legal documents

### Deployment
- **Netlify** - Static site hosting with CI/CD
- **Supabase Edge Functions** - Serverless functions for backend logic
- **Environment Variables** - Secure configuration management

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Supabase account** (free tier available)
- **OpenAI API key** (for AI chat functionality)
- **Paystack account** (for payment processing)

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/easyia.git
cd easyia
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > API**
3. Copy your **Project URL** and **Public anon key**

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (for AI chat)
VITE_OPENAI_API_KEY=your_openai_api_key

# Paystack Configuration (for payments)
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Google Analytics (optional)
VITE_GA_MEASUREMENT_ID=your_ga_measurement_id
```

### 5. Set Up Database

Run the database migrations in your Supabase SQL editor:

```sql
-- Copy and paste the contents of supabase/migrations files
-- This will create all necessary tables, policies, and seed data
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the application running!

## 📁 Project Structure

```
easyia/
├── src/
│   ├── components/          # React components
│   │   ├── admin/          # Admin dashboard components
│   │   ├── auth/           # Authentication forms
│   │   ├── chat/           # Chat interface components
│   │   ├── layout/         # Layout components
│   │   ├── subscription/   # Subscription management
│   │   └── ui/             # Reusable UI components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Library configurations
│   ├── services/           # API service classes
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migration files
├── public/                 # Static assets
└── dist/                   # Build output
```

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - Extended user profiles with roles and preferences
- **subscription_plans** - Available subscription tiers
- **subscriptions** - User subscription records
- **chat_sessions** - Chat conversation metadata
- **messages** - Individual chat messages
- **documents** - Uploaded legal documents
- **document_chunks** - Processed document chunks with embeddings
- **citations** - Legal case and statute metadata
- **payment_transactions** - Payment history

## 🔐 Authentication & Security

- **Supabase Auth** - Secure user authentication with role-based access
- **Row Level Security** - Database-level access control
- **JWT Tokens** - Secure session management
- **Environment Variables** - Secure API key storage
- **Role-based Features** - Tier-based feature access control

## 💰 Subscription Plans

### Free Plan
- Basic chat functionality
- Upload up to 5 documents
- 50 AI queries per month
- Basic support

### Pro Plan ($29.99/month)
- Unlimited document uploads
- Unlimited AI queries
- Internet search integration
- Citation generator
- Case summarizer
- Priority support

### Enterprise Plan ($99.99/month)
- All Pro features
- Team collaboration
- AI drafting assistant
- Analytics dashboard
- White-label options
- Dedicated support

## 🚀 Deployment

### Deploy to Netlify

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`
   - Add environment variables in Netlify dashboard

### Environment Variables for Production

Make sure to set these in your deployment platform:

```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_key
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
VITE_GA_MEASUREMENT_ID=your_ga_measurement_id
```

## 🧪 Testing

### Manual Testing
1. **User Registration**: Create new accounts with different roles
2. **Document Upload**: Test PDF/DOCX file processing
3. **AI Chat**: Verify chat functionality and citations
4. **Subscription**: Test payment flow (sandbox mode)
5. **Admin Features**: Test admin dashboard functionality

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Use TypeScript for type safety
- Follow the existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 📝 API Documentation

### Chat API

```typescript
// Send message to AI
const response = await ChatService.sendMessage({
  sessionId: string,
  message: string,
  userId: string
});
```

### Document API

```typescript
// Upload legal document
const result = await DocumentService.uploadDocument({
  file: File,
  userId: string
});
```

### Subscription API

```typescript
// Initialize subscription payment
const payment = await SubscriptionService.initializePayment(planId);

// Verify payment
const result = await SubscriptionService.verifyPayment(reference);
```

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify your Supabase URL and API key
   - Check if your Supabase project is active

2. **OpenAI API Error**
   - Ensure your OpenAI API key is valid
   - Check your OpenAI account credits

3. **Payment Issues**
   - Verify Paystack public key
   - Ensure you're using the correct environment (test/live)

4. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check for TypeScript errors: `npm run lint`

### Getting Help

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact support at support@easyia.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT-4 API
- **Supabase** for the excellent backend platform
- **Paystack** for payment processing
- **Tailwind CSS** for the beautiful styling
- **Framer Motion** for smooth animations
- **Netlify** for hosting and deployment

## 📊 Project Stats

- **Lines of Code**: ~8,000+
- **Components**: 30+
- **Database Tables**: 10+
- **API Integrations**: 3 (Supabase, OpenAI, Paystack)
- **Responsive Design**: Mobile-first approach

---

**Built with ❤️ by [eLxis](https://github.com/elxisme)**

[⭐ Star this repo](https://github.com/yourusername/easyia) if you found it helpful!