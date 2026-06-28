import { Box, Typography } from "@mui/material";

function EmptyState({ text }) {
  return (
    <Box sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>
      <Typography>{text}</Typography>
    </Box>
  );
}

export default EmptyState;