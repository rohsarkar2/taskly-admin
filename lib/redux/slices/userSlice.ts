import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  id: string;
  name: string;
  email: string;
  userType: string;
  organizationId: string;
  organizationName: string;
  uniqueOrganizationId: string;
}

interface Organization {
  id: string;
  name: string;
  uniqueOrganizationId: string;
  organizationSize: string;
}

interface UserState {
  user: User | null;
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
    setUser: (state, action: PayloadAction<User>) => {
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
