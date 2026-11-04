import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App.jsx';

beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const response = (body, ok = true) => ({ ok, json: async () => body });
function signIn(role = 'Parent') {
  fireEvent.click(screen.getByRole('button', { name: `Demo: ${role}` }));
  fireEvent.click(screen.getByRole('button', { name: 'Sign in', exact: true }));
}

describe('Walking skeleton login and role screens', () => {
  it('renders login fields without a role selector and fills synthetic demo credentials', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Child Development Platform');
    expect(screen.queryByRole('combobox')).toBeNull();
    fireEvent.click(screen.getByRole('button', {name:'Demo: Parent'}));
    expect(screen.getByLabelText('Email').value).toBe('selin.yildiz@example.com');
    expect(screen.getByLabelText('Password').value).toBe('Password123!');
  });
  it.each([
    ['Parent', 'parent', 'Parent Dashboard (Walking Skeleton)'],
    ['Specialist (Linked)', 'specialist', 'Specialist Workspace (Walking Skeleton)'],
    ['Child', 'child', 'My Tasks & Schedule (Walking Skeleton)'],
  ])('shows the account role screen for %s and clears it on logout', async (demo, role, heading) => {
    fetch.mockResolvedValueOnce(response({token:'demo-token',user:{name:'Synthetic user',email:'demo@example.com',role}}));
    render(<App />);
    signIn(demo);
    expect(await screen.findByRole('heading',{name:heading})).toBeTruthy();
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toMatchObject({password:'Password123!'});
    expect(JSON.parse(options.body)).not.toHaveProperty('role');
    expect(Boolean(screen.queryByRole('button',{name:'Load Weekly AI Summary Preview'}))).toBe(role !== 'child');
    fireEvent.click(screen.getByRole('button',{name:'Sign out'}));
    expect(screen.getByRole('heading',{name:'Sign in'})).toBeTruthy();
    expect(screen.queryByRole('heading',{name:heading})).toBeNull();
  });
  it('shows invalid credentials without opening a dashboard', async () => {
    fetch.mockResolvedValueOnce(response({error:'Invalid email or password'},false));
    render(<App />); signIn();
    expect(await screen.findByText('Invalid email or password')).toBeTruthy();
    expect(screen.queryByRole('button',{name:'Sign out'})).toBeNull();
    expect(screen.getByRole('button',{name:'Sign in',exact:true}).disabled).toBe(false);
  });
  it('recovers after a network failure', async () => {
    fetch.mockRejectedValueOnce(new Error('offline'));
    render(<App />); signIn();
    expect(await screen.findByText('Could not connect to server')).toBeTruthy();
    expect(screen.getByRole('button',{name:'Sign in',exact:true}).disabled).toBe(false);
  });
  it('disables submit while login is pending', async () => {
    let finish;
    fetch.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    render(<App />); signIn();
    expect(screen.getByRole('button',{name:'Signing in...'}).disabled).toBe(true);
    finish(response({error:'Login failed'},false));
    expect(await screen.findByText('Login failed')).toBeTruthy();
  });
  it('sends the bearer token and displays the labelled mock summary and record count', async () => {
    fetch.mockResolvedValueOnce(response({token:'demo-token',user:{name:'Parent',role:'parent'}}))
      .mockResolvedValueOnce(response({label:'AI-generated',mode:'mock',summary:'Synthetic weekly summary',sourceRecords:[{id:1,type:'task'}]}));
    render(<App />); signIn();
    fireEvent.click(await screen.findByRole('button',{name:'Load Weekly AI Summary Preview'}));
    expect(await screen.findByText('Synthetic weekly summary')).toBeTruthy();
    expect(screen.getByText('AI-generated')).toBeTruthy();
    expect(screen.getByText(/Mode: mock.*Based on 1 record/)).toBeTruthy();
    expect(fetch).toHaveBeenLastCalledWith('/api/ai/preview',{headers:{Authorization:'Bearer demo-token'}});
    fireEvent.click(screen.getByRole('button',{name:'Sign out'}));
    expect(screen.queryByText('Synthetic weekly summary')).toBeNull();
  });
  it('displays an authorization error from the summary API', async () => {
    fetch.mockResolvedValueOnce(response({token:'demo-token',user:{name:'Specialist',role:'specialist'}}))
      .mockResolvedValueOnce(response({error:'Not linked to any child records'},false));
    render(<App />); signIn('Specialist (Linked)');
    fireEvent.click(await screen.findByRole('button',{name:'Load Weekly AI Summary Preview'}));
    expect(await screen.findByText('Not linked to any child records')).toBeTruthy();
    expect(screen.queryByText('AI-generated')).toBeNull();
  });
});
