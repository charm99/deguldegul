import { IconButton, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

function PageHeader({ title, backTo = -1, action }) {
  const navigate = useNavigate();

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
      {backTo !== null && (
        <IconButton aria-label="뒤로 가기" onClick={() => navigate(backTo)}>
          <ArrowBackIcon />
        </IconButton>
      )}
      <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>
        {title}
      </Typography>
      {action}
    </Stack>
  );
}

export default PageHeader;
