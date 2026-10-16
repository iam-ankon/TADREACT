// Login snapshots the profile photo into localStorage once, at sign-in time
// (see employeeApi.js loginUser). A session that signed in before that photo
// existed - or before this field existed - never gets it without logging
// out and back in. This self-heals it: if the photo is missing, fetch the
// employee's current record once and cache the result, no re-login needed.
import { useState, useEffect } from "react";
import { getEmployeeById } from "../../api/employeeApi";

export const useEmployeeImage = () => {
  const [image, setImage] = useState(
    () => localStorage.getItem("employee_image") || "",
  );

  useEffect(() => {
    if (image) return;
    const id = localStorage.getItem("employee_db_id");
    if (!id) return;
    let cancelled = false;
    getEmployeeById(id)
      .then((res) => {
        const url = res?.data?.image1;
        if (!cancelled && url) {
          localStorage.setItem("employee_image", url);
          setImage(url);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [image]);

  return image;
};
