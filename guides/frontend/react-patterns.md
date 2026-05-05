---
inclusion: manual
lastVerified:
lastUsedInTask:
---

# React Patterns

## Component Design

- Functional components only (no class components)
- Keep components small and focused (single responsibility)
- Extract custom hooks for reusable logic
- Use component composition over prop drilling
- Prefer children and render props for flexibility

## Hooks Usage

- Use `useState` for local component state
- Use `useEffect` sparingly, prefer derived state
- Memoize expensive computations with `useMemo`
- Memoize callbacks passed to children with `useCallback`
- Extract complex logic into custom hooks
- Follow rules of hooks (top level, same order)

## Performance

- Memoize components with `memo` when needed
- Use `useMemo` for expensive calculations
- Use `useCallback` for callbacks passed to memoized children
- Avoid inline object/array literals in JSX when passed as props
- Use keys properly in lists

## Examples

```typescript
// ❌ Bad: Large component with mixed concerns
const UserProfile = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  // ... lots of logic
  return <div>...</div>;
};

// ✅ Good: Separated concerns with custom hooks
const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  // ... user logic
  return user;
};

const usePosts = (userId: string) => {
  const [posts, setPosts] = useState<Post[]>([]);
  // ... posts logic
  return posts;
};

const UserProfile = ({ userId }: { userId: string }) => {
  const user = useUser(userId);
  const posts = usePosts(userId);
  
  if (!user) return <UserSkeleton />;
  
  return (
    <div>
      <UserHeader user={user} />
      <PostList posts={posts} />
    </div>
  );
};
```
