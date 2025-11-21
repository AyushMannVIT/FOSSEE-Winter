import axios from 'axios';

// With CRA proxy, we can use relative '/api'.
let baseURL = process.env.REACT_APP_API_BASE || '/api';

// Auto-fix: If the user set the URL to the root (e.g. https://app.onrender.com)
// but forgot the '/api' suffix, we append it here.
if (baseURL.startsWith('http') && !baseURL.endsWith('/api') && !baseURL.endsWith('/api/')) {
  baseURL = baseURL.replace(/\/$/, '') + '/api';
}

const api = axios.create({ baseURL });

export default api;
