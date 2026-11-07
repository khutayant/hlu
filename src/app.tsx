import { AppRoutes } from './routes/app.routes';
import { AuthProvider } from './providers/auth.provider';
import { ModuleProvider } from './providers/module.provider';

function App() {
  return (
    <AuthProvider>
      <ModuleProvider>
        <AppRoutes />
      </ModuleProvider>
    </AuthProvider>
  );
}

export default App;
