import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

const renderRoute = (authValue, roles) => {
  useAuth.mockReturnValue(authValue);

  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route
          path="/protected"
          element={(
            <ProtectedRoute roles={roles}>
              <div>Private content</div>
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProtectedRoute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('shows loading state while auth is resolving', () => {
    renderRoute({ loading: true, isAuthenticated: false, user: null });

    expect(screen.getByText('Завантаження...')).toBeInTheDocument();
  });

  test('redirects anonymous users to login', () => {
    renderRoute({ loading: false, isAuthenticated: false, user: null });

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  test('redirects authenticated users without allowed role to home', () => {
    renderRoute(
      { loading: false, isAuthenticated: true, user: { role: 'student' } },
      ['admin', 'teacher']
    );

    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  test('renders children for allowed users', () => {
    renderRoute(
      { loading: false, isAuthenticated: true, user: { role: 'teacher' } },
      ['teacher']
    );

    expect(screen.getByText('Private content')).toBeInTheDocument();
  });
});