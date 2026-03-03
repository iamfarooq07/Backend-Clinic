// Quick test to check if server is running
import axios from 'axios';

const testServer = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is running!');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Server is NOT running!');
    console.log('Error:', error.message);
    console.log('\nPlease start the server with: npm run dev');
  }
};

testServer();
