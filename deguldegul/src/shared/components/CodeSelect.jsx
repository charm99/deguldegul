import { MenuItem, TextField } from "@mui/material";
import { useCommonCodes } from "../../contexts/useCommonCodes";

function CodeSelect({ group, includeEmpty, emptyLabel = "선택", ...props }) {
  const { getCodes, loading } = useCommonCodes();
  const options = getCodes(group);

  return (
    <TextField select disabled={loading || props.disabled} {...props}>
      {includeEmpty && <MenuItem value="">{emptyLabel}</MenuItem>}
      {options.map((item) => (
        <MenuItem key={item.com_cd} value={item.com_cd}>
          {item.com_nm}
        </MenuItem>
      ))}
    </TextField>
  );
}

export default CodeSelect;
