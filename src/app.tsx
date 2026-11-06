import { Flex, Spin } from 'antd';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import HomeLayout from './layouts/home.layout';

const SamplePage = lazy(
  () => import('./pages/home/sample-page/sample-page'),
);

function App() {
  return (
    <Suspense
      fallback={
        <Flex align='center' justify='center' style={{ minHeight: '50vh' }}>
          <Spin size='large' />
        </Flex>
      }
    >
      <Routes>
        <Route element={<HomeLayout />}>
          <Route path='/' element={<SamplePage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
