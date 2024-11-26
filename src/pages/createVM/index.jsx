import React from "react";
import { Box, Button, TextField, MenuItem } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import { useMediaQuery } from "@mui/material";
import Header from "../../components/Header";

const Form = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");

  const handleFormSubmit = (values) => {
    const vmJson = {
      vmid: parseInt(values.vmid),
      name: values.vmName,
      memory: parseInt(values.memory),
      cores: parseInt(values.cores),
      sockets: parseInt(values.sockets),
      ostype: values.ostype,
      disk: {
        size: values.diskSize,
        storage: values.storage,
      },
      net: {
        bridge: values.networkBridge,
        model: values.networkModel,
      },
    };

    console.log("Generated JSON:", JSON.stringify(vmJson, null, 2));
    // Aqui você pode enviar o JSON para a API do Proxmox
    // Exemplo: fetch('https://proxmox.cecyber.com/api2/json/nodes/{node}/qemu', { method: 'POST', body: JSON.stringify(vmJson), headers: { 'Content-Type': 'application/json' } })
  };

  const initialValues = {
    vmid: "",
    vmName: "",
    memory: "",
    cores: "",
    sockets: "",
    ostype: "linux",
    diskSize: "",
    storage: "local-lvm",
    networkBridge: "vmbr0",
    networkModel: "virtio",
  };

  const validationSchema = yup.object().shape({
    vmid: yup.number().required("VM ID is required"),
    vmName: yup.string().required("VM Name is required"),
    memory: yup.number().required("Memory is required"),
    cores: yup.number().required("Number of cores is required"),
    sockets: yup.number().required("Number of sockets is required"),
    ostype: yup.string().required("OS type is required"),
    diskSize: yup.string().required("Disk size is required"),
    storage: yup.string().required("Storage is required"),
    networkBridge: yup.string().required("Network bridge is required"),
    networkModel: yup.string().required("Network model is required"),
  });

  return (
    <Box m="20px">
      <Header title="CREATE VM" subtitle="Create a New Virtual Machine" />

      <Formik
        onSubmit={handleFormSubmit}
        initialValues={initialValues}
        validationSchema={validationSchema}
      >
        {({
          values,
          errors,
          touched,
          handleBlur,
          handleChange,
          handleSubmit,
        }) => (
          <form onSubmit={handleSubmit}>
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
              }}
            >
              <TextField
                fullWidth
                variant="filled"
                type="number"
                label="VM ID"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.vmid}
                name="vmid"
                error={!!touched.vmid && !!errors.vmid}
                helperText={touched.vmid && errors.vmid}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label="VM Name"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.vmName}
                name="vmName"
                error={!!touched.vmName && !!errors.vmName}
                helperText={touched.vmName && errors.vmName}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="number"
                label="Memory (MiB)"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.memory}
                name="memory"
                error={!!touched.memory && !!errors.memory}
                helperText={touched.memory && errors.memory}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="number"
                label="Cores"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.cores}
                name="cores"
                error={!!touched.cores && !!errors.cores}
                helperText={touched.cores && errors.cores}
                sx={{ gridColumn: "span 1" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="number"
                label="Sockets"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.sockets}
                name="sockets"
                error={!!touched.sockets && !!errors.sockets}
                helperText={touched.sockets && errors.sockets}
                sx={{ gridColumn: "span 1" }}
              />
              <TextField
                fullWidth
                select
                variant="filled"
                label="OS Type"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.ostype}
                name="ostype"
                error={!!touched.ostype && !!errors.ostype}
                helperText={touched.ostype && errors.ostype}
                sx={{ gridColumn: "span 2" }}
              >
                <MenuItem value="linux">Linux</MenuItem>
                <MenuItem value="win10">Windows 10</MenuItem>
                <MenuItem value="win11">Windows 11</MenuItem>
              </TextField>
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label="Disk Size (e.g., 32G)"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.diskSize}
                name="diskSize"
                error={!!touched.diskSize && !!errors.diskSize}
                helperText={touched.diskSize && errors.diskSize}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label="Storage"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.storage}
                name="storage"
                error={!!touched.storage && !!errors.storage}
                helperText={touched.storage && errors.storage}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label="Network Bridge"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.networkBridge}
                name="networkBridge"
                error={!!touched.networkBridge && !!errors.networkBridge}
                helperText={touched.networkBridge && errors.networkBridge}
                sx={{ gridColumn: "span 2" }}
              />
              <TextField
                fullWidth
                variant="filled"
                type="text"
                label="Network Model"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.networkModel}
                name="networkModel"
                error={!!touched.networkModel && !!errors.networkModel}
                helperText={touched.networkModel && errors.networkModel}
                sx={{ gridColumn: "span 2" }}
              />
            </Box>
            <Box display="flex" justifyContent="end" mt="20px">
              <Button type="submit" color="secondary" variant="contained">
                Create VM
              </Button>
            </Box>
          </form>
        )}
      </Formik>
    </Box>
  );
};

export default Form;
