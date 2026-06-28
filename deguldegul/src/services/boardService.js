import { supabase } from "./supabase";

export async function getBoards(boardTp) {
  let query = supabase
    .from("degul_board")
    .select(`
      board_id,
      board_tp,
      title,
      content,
      writer_id,
      view_cnt,
      created_at,
      updated_at,
      writer:writer_id (
        id,
        name,
        nickname
      )
    `)
    .eq("use_yn", "Y")
    .order("created_at", { ascending: false });

  if (boardTp) {
    query = query.eq("board_tp", boardTp);
  }

  return await query;
}

export async function getBoardDetail(boardId) {
  return await supabase
    .from("degul_board")
    .select(`
      board_id,
      board_tp,
      title,
      content,
      writer_id,
      view_cnt,
      created_at,
      updated_at,
      writer:writer_id (
        id,
        name,
        nickname
      ),
      files:degul_board_file (
        file_id,
        file_name,
        file_path,
        file_size
      )
    `)
    .eq("board_id", boardId)
    .eq("use_yn", "Y")
    .single();
}

export async function increaseViewCount(boardId) {
  return await supabase.rpc("increase_board_view_count", {
    p_board_id: boardId,
  });
}

export async function createBoard({ boardTp, title, content, writerId }) {
  return await supabase
    .from("degul_board")
    .insert({
      board_tp: boardTp,
      title,
      content,
      writer_id: writerId,
    })
    .select("board_id")
    .single();
}

export async function updateBoard(boardId, { title, content }) {
  return await supabase
    .from("degul_board")
    .update({
      title,
      content,
      updated_at: new Date().toISOString(),
    })
    .eq("board_id", boardId);
}

export async function deleteBoard(boardId) {
  return await supabase.rpc("delete_board_soft", {
    p_board_id: boardId,
  });
}

export async function uploadBoardFiles(boardId, files) {
  const uploaded = [];

  for (const file of files) {
    const ext = file.name.split(".").pop();
    const safeName = `${crypto.randomUUID()}.${ext}`;
    const filePath = `${boardId}/${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("board")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { error: insertError } = await supabase
      .from("degul_board_file")
      .insert({
        board_id: boardId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
      });

    if (insertError) {
      throw insertError;
    }

    uploaded.push(filePath);
  }

  return uploaded;
}

export function getBoardFileUrl(filePath) {
  const { data } = supabase.storage.from("board").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getComments(boardId) {
  return await supabase
    .from("degul_board_comment")
    .select(`
      comment_id,
      board_id,
      writer_id,
      content,
      created_at,
      updated_at,
      writer:writer_id (
        id,
        name,
        nickname
      )
    `)
    .eq("board_id", boardId)
    .eq("use_yn", "Y")
    .order("created_at", { ascending: true });
}

export async function createComment({ boardId, writerId, content }) {
  return await supabase.from("degul_board_comment").insert({
    board_id: boardId,
    writer_id: writerId,
    content,
  });
}

export async function deleteComment(commentId) {
  return await supabase
    .from("degul_board_comment")
    .update({
      use_yn: "N",
      updated_at: new Date().toISOString(),
    })
    .eq("comment_id", commentId);
}