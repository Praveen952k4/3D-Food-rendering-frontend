import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { Person, CheckCircle, History, Phone, Email } from '@mui/icons-material';
import { getOnlineUsers, getLoginHistory } from '../../services/api';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const UserManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [onlineRes, historyRes] = await Promise.all([
        getOnlineUsers(),
        getLoginHistory(),
      ]);

      if (onlineRes.data.success) {
        setOnlineUsers(onlineRes.data.users);
      }
      if (historyRes.data.success) {
        setLoginHistory(historyRes.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </div>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        User Management
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" style={{ opacity: 0.9 }}>
                    Online Users
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" mt={1}>
                    {onlineUsers.length}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" style={{ opacity: 0.9 }}>
                    Total Users
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" mt={1}>
                    {loginHistory.length}
                  </Typography>
                </Box>
                <Person sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="body2" style={{ opacity: 0.9 }}>
                    Total Logins (All Time)
                  </Typography>
                  <Typography variant="h3" fontWeight="bold" mt={1}>
                    {loginHistory.reduce((sum, user) => sum + (user.loginHistory?.length || 0), 0)}
                  </Typography>
                </Box>
                <History sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Currently Online" />
          <Tab label="Login History" />
        </Tabs>

        {/* Online Users Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {onlineUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: '#667eea' }}>
                          {user.name ? user.name[0].toUpperCase() : user.phone[0]}
                        </Avatar>
                        <Typography variant="body2" fontWeight="bold">
                          {user.name || 'Unknown'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                        {user.phone}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                        {user.email || 'N/A'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={user.role === 'admin' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm')}</TableCell>
                    <TableCell>
                      <Chip label="Online" color="success" size="small" icon={<CheckCircle />} />
                    </TableCell>
                  </TableRow>
                ))}
                {onlineUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">No users currently online</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Login History Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Last Login</TableCell>
                  <TableCell>Total Logins</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loginHistory.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ bgcolor: user.isOnline ? '#10b981' : '#94a3b8' }}>
                          {user.name ? user.name[0].toUpperCase() : user.phone[0]}
                        </Avatar>
                        <Typography variant="body2" fontWeight="bold">
                          {user.name || 'Unknown'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        size="small"
                        color={user.role === 'admin' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}
                    </TableCell>
                    <TableCell>
                      <Chip label={user.loginHistory?.length || 0} size="small" />
                    </TableCell>
                    <TableCell>
                      {user.isOnline ? (
                        <Chip label="Online" color="success" size="small" />
                      ) : (
                        <Chip label="Offline" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default UserManagement;
