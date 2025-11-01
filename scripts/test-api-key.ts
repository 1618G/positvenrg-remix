import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

async function testKey() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.error('❌ GEMINI_API_KEY not set or invalid');
    process.exit(1);
  }
  
  console.log('🧪 Testing Gemini API key...');
  console.log('Key starts with:', apiKey.substring(0, 10) + '...');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const result = await model.generateContent('Say hello in one sentence');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API Key is VALID and working!');
    console.log('Response:', text);
    console.log('');
    console.log('🎉 Your companions will now use real AI responses!');
  } catch (error: any) {
    console.error('❌ API Key test failed:');
    console.error('Error:', error.message);
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('expired')) {
      console.error('');
      console.error('The API key is invalid or expired. Please get a new one from:');
      console.error('https://aistudio.google.com/apikey');
    }
    process.exit(1);
  }
}

testKey();

