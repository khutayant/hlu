import AddIcon from '@mui/icons-material/Add'
import { Box, Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'

function HomePage() {
  const [count, setCount] = useState(0)

  return (
    <Stack spacing={3} className="w-full max-w-xl">
      <Box>
        <Typography variant="h4" component="h2" gutterBottom>
          React + MUI + Tailwind + Vite
        </Typography>
        <Typography color="text.secondary" className="text-pretty">
          Use MUI components with Tailwind utility classes. Edit{' '}
          <code>src/pages/home/home.tsx</code> to start building.
        </Typography>
      </Box>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setCount((value) => value + 1)}
        className="self-start"
      >
        Count is {count}
      </Button>
    </Stack>
  )
}

export default HomePage
