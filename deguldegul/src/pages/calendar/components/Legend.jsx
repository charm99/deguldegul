import { Box, Stack, Typography } from "@mui/material";

function Legend({ color, label }) {
  return (
    <Stack direction="row" spacing={0.7} alignItems="center">
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color }} />
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Stack>
  );
}

export default Legend;