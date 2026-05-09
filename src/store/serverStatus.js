import { createSlice } from "@reduxjs/toolkit";

const initialServerStatusState = {
  serverStatus: "offline",
};

const serverStatusSlice = createSlice({
  name: "serverStatus",
  initialState: initialServerStatusState,
  reducers: {
    serverStatusChange(state, action) {
      console.log("SERVER status change", action);
      state.serverStatus = action.payload;
    },
  },
});

export const serverStatusActions = serverStatusSlice.actions;

export default serverStatusSlice.reducer;
