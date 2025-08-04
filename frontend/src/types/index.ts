export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  credits: number;
  is_active: boolean;
}

export interface Task {
  id: number;
  name: string;
  description?: string;
  credits: number;
  task_type: 'individual' | 'collective';
  is_active: boolean;
  created_at: string;
}

export interface TaskAssignment {
  id: number;
  task_id: number;
  user_id: number;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  completed_at?: string;
  approved_at?: string;
  approved_by?: number;
  created_at: string;
  task?: Task;
  user?: {
    id: number;
    username: string;
  };
}

export interface Reward {
  id: number;
  name: string;
  description?: string;
  cost: number;
  is_active: boolean;
  created_at: string;
}

export interface RewardRedemption {
  id: number;
  reward_id: number;
  user_id: number;
  redeemed_at: string;
  reward?: Reward;
}

export interface UserStats {
  total_tasks_completed: number;
  total_credits_earned: number;
  pending_tasks: number;
  approved_tasks: number;
  rejected_tasks: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
