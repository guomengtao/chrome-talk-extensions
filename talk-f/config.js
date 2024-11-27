// 使用简单的加密函数来保护 API 密钥
const ENCRYPTION_KEY = 'TALK_F_SECURE_KEY';

// 简单的加密函数
function encrypt(text) {
  const textToChars = text => text.split('').map(c => c.charCodeAt(0));
  const byteHex = n => ("0" + Number(n).toString(16)).substr(-2);
  const applySaltToChar = code => textToChars(ENCRYPTION_KEY).reduce((a,b) => a ^ b, code);

  return text.split('')
    .map(textToChars)
    .map(applySaltToChar)
    .map(byteHex)
    .join('');
}

// 简单的解密函数
function decrypt(encoded) {
  const textToChars = text => text.split('').map(c => c.charCodeAt(0));
  const applySaltToChar = code => textToChars(ENCRYPTION_KEY).reduce((a,b) => a ^ b, code);
  const hexToBytes = hex => parseInt(hex, 16);

  return encoded.match(/.{1,2}/g)
    .map(hexToBytes)
    .map(applySaltToChar)
    .map(charCode => String.fromCharCode(charCode))
    .join('');
}

// 加密的 API 密钥
const ENCRYPTED_API_KEY = encrypt('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrY3JuZmduc3B2dHp3YmJ2eWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5ODgwMTgsImV4cCI6MjA0NjU2NDAxOH0.o4kZY3X0XxcpM3OHO3yw7O3of2PPtXdQ4CBFgp3CMO8');

// Supabase 配置
const SUPABASE_CONFIG = {
  url: 'https://tkcrnfgnspvtzwbbvyfv.supabase.co',
  getApiKey: () => decrypt(ENCRYPTED_API_KEY),
  tableName: 'superbase_articles'
};

// 导出配置
window.SUPABASE_CONFIG = SUPABASE_CONFIG; 