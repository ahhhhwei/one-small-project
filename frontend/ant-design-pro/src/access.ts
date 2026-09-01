/**
 * @see https://umijs.org/docs/max/access#access
 * */
import type { AuthUser } from '@/services/academic';

export default function access(initialState: { currentUser?: AuthUser } | undefined) {
  const { currentUser } = initialState ?? {};
  return {
    canAdmin: currentUser?.role === 'admin',
    canTeacher: currentUser?.role === 'teacher',
    canStudent: currentUser?.role === 'student',
  };
}
