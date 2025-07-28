import { APPCONSTANTS } from '../utils/constants';

export interface WelcomeEmailData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export async function sendWelcomeEmail(userData: WelcomeEmailData) {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${APPCONSTANTS.API_BASE_URL}/api/v1/auth/welcome-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send welcome email: ${errorText}`);
  }

  return await response.json();
}
