// Placeholder for authentication hook
export const useAuth = () => {
  return {
    user: null,
    isAuthenticated: false,
    loading: false,
    login: () => {},
    logout: () => {},
  };
};
