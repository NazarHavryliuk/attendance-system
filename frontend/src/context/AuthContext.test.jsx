import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

import { authApi } from '../services/api';

const AuthConsumer = () => {
  const { user, studentProfile, loading, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <p>loading:{String(loading)}</p>
      <p>authenticated:{String(isAuthenticated)}</p>
      <p>user:{user?.email || 'none'}</p>
      <p>student:{studentProfile?.name || 'none'}</p>
      <button type="button" onClick={() => login('teacher@example.com', 'secret')}>
        login
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test('completes initialization without token', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('loading:false')).toBeInTheDocument();
    });

    expect(authApi.me).not.toHaveBeenCalled();
    expect(screen.getByText('authenticated:false')).toBeInTheDocument();
    expect(screen.getByText('user:none')).toBeInTheDocument();
  });

  test('loads current user when token exists', async () => {
    localStorage.setItem('token', 'persisted-token');
    authApi.me.mockResolvedValue({
      data: {
        data: {
          user: { email: 'student@example.com', role: 'student' },
          studentProfile: { name: 'Bohdan' },
        },
      },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('authenticated:true')).toBeInTheDocument();
    });

    expect(authApi.me).toHaveBeenCalledTimes(1);
    expect(screen.getByText('user:student@example.com')).toBeInTheDocument();
    expect(screen.getByText('student:Bohdan')).toBeInTheDocument();
  });

  test('clears stale token when profile request fails', async () => {
    localStorage.setItem('token', 'expired-token');
    authApi.me.mockRejectedValue(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('loading:false')).toBeInTheDocument();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByText('authenticated:false')).toBeInTheDocument();
  });

  test('login stores token and refreshes current user', async () => {
    const user = userEvent.setup();
    authApi.me.mockResolvedValueOnce({
      data: {
        data: {
          user: null,
          studentProfile: null,
        },
      },
    });
    authApi.login.mockResolvedValue({
      data: {
        data: {
          token: 'fresh-token',
        },
      },
    });
    authApi.me.mockResolvedValueOnce({
      data: {
        data: {
          user: { email: 'teacher@example.com', role: 'teacher' },
          studentProfile: null,
        },
      },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('loading:false')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => {
      expect(screen.getByText('authenticated:true')).toBeInTheDocument();
    });

    expect(authApi.login).toHaveBeenCalledWith({ email: 'teacher@example.com', password: 'secret' });
    expect(localStorage.getItem('token')).toBe('fresh-token');
    expect(screen.getByText('user:teacher@example.com')).toBeInTheDocument();
  });

  test('logout clears stored auth state', async () => {
    const user = userEvent.setup();
    localStorage.setItem('token', 'persisted-token');
    authApi.me.mockResolvedValue({
      data: {
        data: {
          user: { email: 'student@example.com', role: 'student' },
          studentProfile: { name: 'Bohdan' },
        },
      },
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('authenticated:true')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'logout' }));

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByText('authenticated:false')).toBeInTheDocument();
    expect(screen.getByText('user:none')).toBeInTheDocument();
    expect(screen.getByText('student:none')).toBeInTheDocument();
  });
});