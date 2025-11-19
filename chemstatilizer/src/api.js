import axios from 'axios';

// With CRA proxy, we can use relative '/api'.
const baseURL = process.env.REACT_APP_API_BASE || '/api';

const api = axios.create({ baseURL });

export default api;
