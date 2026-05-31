import { createSlice } from "@reduxjs/toolkit";

const initialServerStatusState = {
  serverStatus: "checking",
  cacheSummary: {}
};

const serverStatusSlice = createSlice({
  name: "serverStatus",
  initialState: initialServerStatusState,
  reducers: {
    serverStatusChange(state, action) {
      state.serverStatus = action.payload;
    },
    updateCacheSummary(state, action){
      state.cacheSummary = action.payload
    }
  },
});

export const serverStatusActions = serverStatusSlice.actions;

export default serverStatusSlice.reducer;
