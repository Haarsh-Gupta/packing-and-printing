export function validatePassword(password: string): string | null {
  if (password.length < 6) {
    return "Password must be at least 6 characters long.";
  }
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNum = /[0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasNum) {
    return "Password must contain at least one uppercase letter, one lowercase letter, and one number.";
  }

  return null;
}

export function getFriendlyErrorMessage(error: string | any): string {
  if (typeof error !== 'string') {
    return "An unexpected error occurred. Please try again.";
  }

  // Common Pydantic/FastAPI error mapping
  if (error.includes("Password must contain")) {
    return "Your password must include at least one uppercase letter, one lowercase letter, and one number.";
  }
  
  if (error.includes("String should have at least 6 characters")) {
      return "Password must be at least 6 characters long.";
  }

  if (error.includes("User already exists")) {
    return "An account with this email already exists. Please try signing in.";
  }

  if (error.includes("Invalid credentials") || error.includes("incorrect email or password")) {
    return "The email or password you entered is incorrect.";
  }

  if (error.includes("Phone number must be 10 digits")) {
    return "Please enter a valid 10-digit phone number.";
  }

  if (error.includes("Could not validate credentials")) {
      return "Your session has expired. Please log in again.";
  }

  if (error.includes("Failed to fetch")) {
      return "Unable to connect to the server. Please check your internet connection.";
  }

  return error;
}
