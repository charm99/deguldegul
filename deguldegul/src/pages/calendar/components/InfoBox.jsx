import { Box, Typography } from "@mui/material";

function InfoBox({ label, value }) {
  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: "#f5f6fa",
        borderRadius: 2,
        p: 1,
        textAlign: "center",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={800}>{value}</Typography>
    </Box>
  );
}

export default InfoBox;