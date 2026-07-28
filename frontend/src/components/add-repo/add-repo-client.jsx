"use client";

import dynamic from "next/dynamic";
import React from "react";

const AddRepoForm = dynamic(() => import("./add-repo-form"), { ssr: false });

export default function AddRepoClient() {
  return <AddRepoForm />;
}
