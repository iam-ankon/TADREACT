/**
 * frontDeskApi.js
 * API wrapper for the Front Desk module (couriers, sample routing,
 * vendor receipts, visitors, meeting rooms).
 */
import axios from "axios";
import { getBackendURL, getToken } from "./employeeApi";

const BASE = () => `${getBackendURL()}/api/front-desk`;

const authHeaders = () => ({
  headers: { Authorization: `Token ${getToken()}` },
});

const makeResource = (path) => ({
  list: (params = {}) => axios.get(`${BASE()}/${path}/`, { ...authHeaders(), params }),
  create: (data) => axios.post(`${BASE()}/${path}/`, data, authHeaders()),
  update: (id, data) => axios.patch(`${BASE()}/${path}/${id}/`, data, authHeaders()),
  remove: (id) => axios.delete(`${BASE()}/${path}/${id}/`, authHeaders()),
});

export const couriersApi = makeResource("couriers");
export const sampleMovementsApi = makeResource("sample-movements");
export const vendorReceiptsApi = makeResource("vendor-receipts");
export const visitorsApi = makeResource("visitors");
export const meetingRoomsApi = makeResource("meeting-rooms");
