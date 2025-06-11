import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  updatePermissions,
} from '../../controllers/SettingsControllers';

import {
  ROLE_TYPES,
  PERMISSION_MODULES,
  PERMISSION_ACTIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from '../../utils/constants';

// Mock data for development
const MOCK_ROLES: Role[] = [
  {
    _id: '1',
    name: 'Super Administrator',
    type: 'SUPER_ADMIN',
    description: 'Full system access with all permissions',
    permissions: Object.entries(PERMISSION_MODULES).map(([module]) => ({
      module: module as keyof typeof PERMISSION_MODULES,
      actions: Object.values(PERMISSION_ACTIONS).map(action => action.toUpperCase() as keyof typeof PERMISSION_ACTIONS)
    })),
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '2',
    name: 'Senior Attorney',
    type: 'ATTORNEY',
    description: 'Senior attorney with full case management capabilities',
    permissions: [
      {
        module: 'CASES',
        actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'ASSIGN', 'SHARE']
      },
      {
        module: 'DOCUMENTS',
        actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SHARE']
      },
      {
        module: 'USERS',
        actions: ['READ']
      },
      {
        module: 'SETTINGS',
        actions: ['READ']
      },
      {
        module: 'REPORTS',
        actions: ['READ', 'EXPORT']
      },
      {
        module: 'BILLING',
        actions: ['READ']
      },
      {
        module: 'CALENDAR',
        actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SHARE']
      },
      {
        module: 'COMMUNICATIONS',
        actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'SHARE']
      },
      {
        module: 'ANALYTICS',
        actions: ['READ']
      }
    ],
    isDefault: false,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    _id: '3',
    name: 'Paralegal',
    type: 'PARALEGAL',
    description: 'Paralegal with case support capabilities',
    permissions: [
      {
        module: 'CASES',
        actions: ['READ', 'UPDATE']
      },
      {
        module: 'DOCUMENTS',
        actions: ['CREATE', 'READ', 'UPDATE']
      },
      {
        module: 'USERS',
        actions: ['READ']
      },
      {
        module: 'SETTINGS',
        actions: ['READ']
      },
      {
        module: 'REPORTS',
        actions: ['READ']
      },
      {
        module: 'BILLING',
        actions: ['READ']
      },
      {
        module: 'CALENDAR',
        actions: ['READ', 'UPDATE']
      },
      {
        module: 'COMMUNICATIONS',
        actions: ['READ', 'UPDATE']
      },
      {
        module: 'ANALYTICS',
        actions: ['READ']
      }
    ],
    isDefault: false,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  },
  {
    _id: '4',
    name: 'Client',
    type: 'CLIENT',
    description: 'Client with limited access to their own cases',
    permissions: [
      {
        module: 'CASES',
        actions: ['READ']
      },
      {
        module: 'DOCUMENTS',
        actions: ['READ']
      },
      {
        module: 'USERS',
        actions: ['READ']
      },
      {
        module: 'SETTINGS',
        actions: ['READ']
      },
      {
        module: 'REPORTS',
        actions: ['READ']
      },
      {
        module: 'BILLING',
        actions: ['READ']
      },
      {
        module: 'CALENDAR',
        actions: ['READ']
      },
      {
        module: 'COMMUNICATIONS',
        actions: ['READ', 'UPDATE']
      },
      {
        module: 'ANALYTICS',
        actions: ['READ']
      }
    ],
    isDefault: false,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z'
  }
];

interface Role {
  _id?: string;
  name: string;
  type: keyof typeof ROLE_TYPES;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Permission {
  module: keyof typeof PERMISSION_MODULES;
  actions: Array<keyof typeof PERMISSION_ACTIONS>;
}

const RolesPermissionsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isNewRoleDialogOpen, setIsNewRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<Partial<Role>>({
    name: '',
    type: 'STAFF',
    description: '',
    permissions: [],
    isDefault: false,
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      // Use mock data during development
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isDevelopment) {
        setRoles(MOCK_ROLES);
        return;
      }

      const response = await getRoles('current');
      if (response.data) {
        setRoles(response.data.roles);
      }
    } catch (error) {
      enqueueSnackbar('Failed to load roles', { variant: 'error' });
    }
  };

  const handleRoleSelect = async (role: Role) => {
    try {
      const response = await getPermissions('current', role._id!);
      if (response.data) {
        setSelectedRole({ ...role, permissions: response.data.permissions });
      }
    } catch (error) {
      enqueueSnackbar('Failed to load role permissions', { variant: 'error' });
    }
    setIsEditMode(false);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedRole(roles.find(r => r._id === selectedRole?._id) || null);
  };

  const handleSaveRole = async () => {
    if (!selectedRole) return;

    try {
      const [roleResponse, permissionsResponse] = await Promise.all([
        updateRole('current', selectedRole._id!, selectedRole),
        updatePermissions('current', { permissions: selectedRole.permissions, roleId: selectedRole._id! })
      ]);
      
      if (roleResponse.data && permissionsResponse.data) {
        setRoles(roles.map(r => r._id === roleResponse.data._id ? roleResponse.data : r));
        setIsEditMode(false);
        enqueueSnackbar('Role updated successfully', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar('Failed to update role', { variant: 'error' });
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRole?._id) return;

    try {
      await deleteRole('current', selectedRole._id);
      setRoles(roles.filter(r => r._id !== selectedRole._id));
      setSelectedRole(null);
      setIsDeleteDialogOpen(false);
      enqueueSnackbar('Role deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Failed to delete role', { variant: 'error' });
    }
  };

  const handleNewRoleClick = () => {
    const defaultPermissions = DEFAULT_ROLE_PERMISSIONS[newRole.type as keyof typeof DEFAULT_ROLE_PERMISSIONS] || [];
    setNewRole({
      name: '',
      type: 'STAFF',
      description: '',
      permissions: Object.entries(defaultPermissions).map(([module, actions]) => ({
        module: module as keyof typeof PERMISSION_MODULES,
        actions: actions as Array<keyof typeof PERMISSION_ACTIONS>
      })),
      isDefault: false,
    });
    setIsNewRoleDialogOpen(true);
  };

  const handleCreateRole = async () => {
    try {
      const response = await createRole('current', newRole as Role);
      if (response.data) {
        setRoles([...roles, response.data]);
        setIsNewRoleDialogOpen(false);
        enqueueSnackbar('Role created successfully', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar('Failed to create role', { variant: 'error' });
    }
  };

  const handlePermissionChange = (module: keyof typeof PERMISSION_MODULES, action: keyof typeof PERMISSION_ACTIONS) => {
    if (!selectedRole) return;

    const updatedPermissions = [...selectedRole.permissions];
    const moduleIndex = updatedPermissions.findIndex(p => p.module === module);

    if (moduleIndex === -1) {
      updatedPermissions.push({
        module,
        actions: [action],
      });
    } else {
      const actionIndex = updatedPermissions[moduleIndex].actions.indexOf(action);
      if (actionIndex === -1) {
        updatedPermissions[moduleIndex].actions.push(action);
      } else {
        updatedPermissions[moduleIndex].actions.splice(actionIndex, 1);
        if (updatedPermissions[moduleIndex].actions.length === 0) {
          updatedPermissions.splice(moduleIndex, 1);
        }
      }
    }

    setSelectedRole({
      ...selectedRole,
      permissions: updatedPermissions,
    });
  };

  const renderPermissionsTable = () => {
    if (!selectedRole) return null;

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Module</TableCell>
              {Object.values(PERMISSION_ACTIONS).map(action => (
                <TableCell key={action} align="center">
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.values(PERMISSION_MODULES).map(module => (
              <TableRow key={module}>
                <TableCell>{module.charAt(0).toUpperCase() + module.slice(1)}</TableCell>
                {Object.values(PERMISSION_ACTIONS).map(action => (
                  <TableCell key={action} align="center">
                    <Checkbox
                      checked={selectedRole.permissions.some(
                        p => p.module === module.toUpperCase() && p.actions.includes(action.toUpperCase() as keyof typeof PERMISSION_ACTIONS)
                      )}
                      onChange={() => handlePermissionChange(module.toUpperCase() as keyof typeof PERMISSION_MODULES, action.toUpperCase() as keyof typeof PERMISSION_ACTIONS)}
                      disabled={!isEditMode}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4">Roles & Permissions</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleNewRoleClick}
            >
              New Role
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Roles
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                {roles.map(role => (
                  <Paper
                    key={role._id}
                    sx={{
                      p: 2,
                      mb: 1,
                      cursor: 'pointer',
                      bgcolor: selectedRole?._id === role._id ? 'action.selected' : 'background.paper',
                    }}
                    onClick={() => handleRoleSelect(role)}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1">{role.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {role.description}
                        </Typography>
                      </Box>
                      {role.isDefault && (
                        <Chip label="Default" size="small" color="primary" />
                      )}
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedRole ? (
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    {isEditMode ? 'Edit Role' : 'Role Details'}
                  </Typography>
                  <Box>
                    {isEditMode ? (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<SaveIcon />}
                          onClick={handleSaveRole}
                          sx={{ mr: 1 }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={handleEditClick}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={handleDeleteClick}
                          disabled={selectedRole.isDefault}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>

                {isEditMode ? (
                  <Box sx={{ mb: 3 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Role Name"
                          value={selectedRole.name}
                          onChange={(e) =>
                            setSelectedRole({ ...selectedRole, name: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Role Type</InputLabel>
                          <Select
                            value={selectedRole.type}
                            label="Role Type"
                            onChange={(e) =>
                              setSelectedRole({
                                ...selectedRole,
                                type: e.target.value as keyof typeof ROLE_TYPES,
                              })
                            }
                          >
                            {Object.entries(ROLE_TYPES).map(([key, value]) => (
                              <MenuItem key={key} value={key}>
                                {value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Description"
                          value={selectedRole.description}
                          onChange={(e) =>
                            setSelectedRole({ ...selectedRole, description: e.target.value })
                          }
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Name: {selectedRole.name}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Type: {selectedRole.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                      Description: {selectedRole.description}
                    </Typography>
                  </Box>
                )}

                <Typography variant="h6" gutterBottom>
                  Permissions
                </Typography>
                {renderPermissionsTable()}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Typography variant="body1" color="text.secondary" align="center">
                  Select a role to view its details and permissions
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* New Role Dialog */}
      <Dialog open={isNewRoleDialogOpen} onClose={() => setIsNewRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid component="div" item xs={12}>
                <TextField
                  fullWidth
                  label="Role Name"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                />
              </Grid>
              <Grid component="div" item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Role Type</InputLabel>
                  <Select
                    value={newRole.type}
                    label="Role Type"
                    onChange={(e) =>
                      setNewRole({
                        ...newRole,
                        type: e.target.value as keyof typeof ROLE_TYPES,
                      })
                    }
                  >
                    {Object.entries(ROLE_TYPES).map(([key, value]) => (
                      <MenuItem key={key} value={key}>
                        {value.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid component="div" item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                />
              </Grid>
              <Grid component="div" item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newRole.isDefault}
                      onChange={(e) => setNewRole({ ...newRole, isDefault: e.target.checked })}
                    />
                  }
                  label="Set as Default Role"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateRole}
            variant="contained"
            color="primary"
            disabled={!newRole.name || !newRole.type}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the role "{selectedRole?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesPermissionsPage; 