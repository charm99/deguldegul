import { Alert, Box, CircularProgress, Typography } from "@mui/material";

function AsyncState({ loading, error, empty, emptyText = "표시할 내용이 없습니다.", children }) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error.message || String(error)}</Alert>;
  }

  if (empty) {
    return (
      <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
        {emptyText}
      </Typography>
    );
  }

  return children;
}

export default AsyncState;
