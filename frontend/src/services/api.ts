import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://pdlc11kz-3000.use2.devtunnels.ms/api',
});