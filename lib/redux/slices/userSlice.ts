import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AdminUser, Organization } from "@/lib/api/types";

interface UserState {
  user: AdminUser | null;
  organization: Organization | null;
}

const initialState: UserState = {
  user: null,
  organization: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AdminUser>) => {
      state.user = action.payload;
    },
    setOrganization: (state, action: PayloadAction<Organization>) => {
      state.organization = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.organization = null;
    },
  },
});

export const { setUser, setOrganization, clearUser } = userSlice.actions;
export default userSlice.reducer;
