import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { useAuthStore } from '../store/auth';
import api from '../lib/axios';

vi.mock('../lib/axios', () => ({
  default: { post: vi.fn(), get: vi.fn() },
}));

const mockedPost = api.post as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ user: null, token: null, loading: false, initialized: true });
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );

describe('LoginPage', () => {
  it('renders email, password and submit button', () => {
    renderPage();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('submits credentials and stores the user on success', async () => {
    const user = userEvent.setup();
    mockedPost.mockResolvedValueOnce({
      data: { user: { id: 'u1', name: 'Alice', email: 'a@b.com' }, token: 'jwt-token' },
    });
    renderPage();

    await user.type(screen.getByPlaceholderText('Email'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Password'), 'secret1');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'secret1' });
    });
    await waitFor(() => {
      expect(useAuthStore.getState().user?.name).toBe('Alice');
      expect(useAuthStore.getState().token).toBe('jwt-token');
    });
  });

  it('shows an error message when login fails', async () => {
    const user = userEvent.setup();
    mockedPost.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });
    renderPage();

    await user.type(screen.getByPlaceholderText('Email'), 'a@b.com');
    await user.type(screen.getByPlaceholderText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
