import api from './api'

export const adminShopApi = {
  getPendingShops: () =>
    api.get('/shops/pending'),
  
  getAllShops: () =>
    api.get('/shops'),
  
  approveShop: (shopId) =>
    api.patch(`/shops/${shopId}/approve`),
  
  rejectShop: (shopId) =>
    api.patch(`/shops/${shopId}/reject`),
}
