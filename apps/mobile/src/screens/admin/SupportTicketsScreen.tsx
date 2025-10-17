import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '@/config/theme';
import { AdminStackParamList } from '@/navigation/AdminNavigator';

type SupportTicketsScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'SupportTickets'>;

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'billing' | 'account' | 'general' | 'feature_request';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  userId: string;
  userName: string;
  userEmail: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  attachments: Array<{ id: string; name: string; url: string }>;
  messages: Array<{
    id: string;
    senderId: string;
    senderName: string;
    senderType: 'user' | 'admin';
    message: string;
    timestamp: string;
    attachments?: Array<{ id: string; name: string; url: string }>;
  }>;
}

interface SupportTicketFilter {
  status: string;
  priority: string;
  category: string;
  assignedTo: string;
  search: string;
}

interface SupportTicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  urgentTickets: number;
}

interface TabButtonProps {
  title: string;
  active: boolean;
  onPress: () => void;
  badge?: number;
}

const TabButton: React.FC<TabButtonProps> = ({ title, active, onPress, badge }) => (
  <TouchableOpacity
    style={[styles.tabButton, active && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
      {title}
    </Text>
    {badge && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
  </TouchableOpacity>
);

interface TicketCardProps {
  ticket: SupportTicket;
  onPress: () => void;
  onAssign: () => void;
  onUpdateStatus: (status: string) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onPress,
  onAssign,
  onUpdateStatus,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return theme.colors.error;
      case 'high': return '#FF9800';
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.outline;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return theme.colors.primary;
      case 'in_progress': return theme.colors.warning;
      case 'resolved': return theme.colors.success;
      case 'closed': return theme.colors.outline;
      default: return theme.colors.outline;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return 'build';
      case 'billing': return 'payment';
      case 'account': return 'person';
      case 'general': return 'help';
      case 'feature_request': return 'lightbulb';
      default: return 'help';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <TouchableOpacity style={styles.ticketCard} onPress={onPress}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketIcon}>
          <Icon name={getCategoryIcon(ticket.category)} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.ticketContent}>
          <Text style={styles.ticketTitle}>{ticket.title}</Text>
          <Text style={styles.ticketUser}>By {ticket.userName}</Text>
        </View>
        <View style={styles.ticketStatus}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(ticket.priority) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
            {ticket.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      
      <Text style={styles.ticketDescription} numberOfLines={2}>
        {ticket.description}
      </Text>
      
      <View style={styles.ticketFooter}>
        <View style={styles.ticketMeta}>
          <Text style={styles.ticketCategory}>
            {ticket.category.replace('_', ' ').toUpperCase()}
          </Text>
          <Text style={styles.ticketPriority}>
            {ticket.priority.toUpperCase()}
          </Text>
          <Text style={styles.ticketTime}>
            {getTimeAgo(ticket.updatedAt)}
          </Text>
        </View>
        <View style={styles.ticketActions}>
          {ticket.status === 'open' && (
            <TouchableOpacity style={styles.actionButton} onPress={onAssign}>
              <Icon name="person-add" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
          {ticket.status !== 'closed' && (
            <TouchableOpacity style={styles.actionButton} onPress={() => onUpdateStatus('closed')}>
              <Icon name="close" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const SupportTicketsScreen: React.FC = () => {
  const navigation = useNavigation<SupportTicketsScreenNavigationProp>();
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [loading, setLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: '1',
      title: 'Payment not processed',
      description: 'I tried to purchase tickets for the concert but my payment was not processed. The money was deducted from my account but I did not receive any tickets.',
      category: 'billing',
      priority: 'high',
      status: 'open',
      userId: 'user1',
      userName: 'John Doe',
      userEmail: 'john@example.com',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      attachments: [],
      messages: [
        {
          id: '1',
          senderId: 'user1',
          senderName: 'John Doe',
          senderType: 'user',
          message: 'I tried to purchase tickets for the concert but my payment was not processed. The money was deducted from my account but I did not receive any tickets.',
          timestamp: '2024-01-15T10:00:00Z',
        },
      ],
    },
    {
      id: '2',
      title: 'Cannot access my account',
      description: 'I forgot my password and the reset email is not working. I have tried multiple times but did not receive any email.',
      category: 'account',
      priority: 'medium',
      status: 'in_progress',
      userId: 'user2',
      userName: 'Jane Smith',
      userEmail: 'jane@example.com',
      assignedTo: 'admin1',
      assignedToName: 'Admin User',
      createdAt: '2024-01-15T09:30:00Z',
      updatedAt: '2024-01-15T11:00:00Z',
      attachments: [],
      messages: [
        {
          id: '1',
          senderId: 'user2',
          senderName: 'Jane Smith',
          senderType: 'user',
          message: 'I forgot my password and the reset email is not working. I have tried multiple times but did not receive any email.',
          timestamp: '2024-01-15T09:30:00Z',
        },
        {
          id: '2',
          senderId: 'admin1',
          senderName: 'Admin User',
          senderType: 'admin',
          message: 'I have checked your account and reset the password. Please check your email for the new password.',
          timestamp: '2024-01-15T11:00:00Z',
        },
      ],
    },
    {
      id: '3',
      title: 'Feature request: Dark mode',
      description: 'It would be great if the app had a dark mode option. Many users prefer dark themes for better battery life and eye comfort.',
      category: 'feature_request',
      priority: 'low',
      status: 'resolved',
      userId: 'user3',
      userName: 'Bob Johnson',
      userEmail: 'bob@example.com',
      assignedTo: 'admin1',
      assignedToName: 'Admin User',
      createdAt: '2024-01-14T16:00:00Z',
      updatedAt: '2024-01-15T08:00:00Z',
      resolvedAt: '2024-01-15T08:00:00Z',
      attachments: [],
      messages: [
        {
          id: '1',
          senderId: 'user3',
          senderName: 'Bob Johnson',
          senderType: 'user',
          message: 'It would be great if the app had a dark mode option. Many users prefer dark themes for better battery life and eye comfort.',
          timestamp: '2024-01-14T16:00:00Z',
        },
        {
          id: '2',
          senderId: 'admin1',
          senderName: 'Admin User',
          senderType: 'admin',
          message: 'Thank you for the suggestion! We have added dark mode to our roadmap and it will be available in the next update.',
          timestamp: '2024-01-15T08:00:00Z',
        },
      ],
    },
  ]);

  const [stats] = useState<SupportTicketStats>({
    totalTickets: 1247,
    openTickets: 23,
    inProgressTickets: 15,
    resolvedTickets: 1209,
    avgResolutionTime: 4.2,
    urgentTickets: 3,
  });

  const [filters, setFilters] = useState<SupportTicketFilter>({
    status: 'all',
    priority: 'all',
    category: 'all',
    assignedTo: 'all',
    search: '',
  });

  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      // dispatch(fetchSupportTickets(filters));
      // Mock loading
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to load tickets:', error);
      Alert.alert('Error', 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTickets = () => {
    let filtered = tickets;

    if (activeTab !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === activeTab);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filters.status);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === filters.priority);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === filters.category);
    }

    if (filters.assignedTo !== 'all') {
      filtered = filtered.filter(ticket => ticket.assignedTo === filters.assignedTo);
    }

    if (filters.search) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        ticket.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        ticket.userName.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  };

  const handleUpdateTicketStatus = (ticketId: string, status: string) => {
    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === ticketId
          ? {
              ...ticket,
              status: status as any,
              updatedAt: new Date().toISOString(),
              resolvedAt: status === 'resolved' ? new Date().toISOString() : undefined,
            }
          : ticket
      )
    );
    Alert.alert('Success', `Ticket status updated to ${status}`);
  };

  const handleAssignTicket = (ticketId: string) => {
    // In a real app, this would open a modal to select an admin
    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === ticketId
          ? {
              ...ticket,
              assignedTo: 'admin1',
              assignedToName: 'Admin User',
              status: 'in_progress',
              updatedAt: new Date().toISOString(),
            }
          : ticket
      )
    );
    Alert.alert('Success', 'Ticket assigned successfully');
  };

  const handleSendMessage = (ticketId: string) => {
    if (!newMessage.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }

    const message = {
      id: Date.now().toString(),
      senderId: 'admin1',
      senderName: 'Admin User',
      senderType: 'admin' as const,
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    setTickets(prev =>
      prev.map(ticket =>
        ticket.id === ticketId
          ? {
              ...ticket,
              messages: [...ticket.messages, message],
              updatedAt: new Date().toISOString(),
            }
          : ticket
      )
    );

    setNewMessage('');
    Alert.alert('Success', 'Message sent successfully');
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const renderTicketModal = () => {
    if (!selectedTicket) return null;

    return (
      <Modal
        visible={showTicketModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Support Ticket #{selectedTicket.id}</Text>
            <TouchableOpacity onPress={() => setShowTicketModal(false)}>
              <Icon name="close" size={24} color={theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketInfoTitle}>{selectedTicket.title}</Text>
              <Text style={styles.ticketInfoDescription}>{selectedTicket.description}</Text>
              
              <View style={styles.ticketInfoMeta}>
                <View style={styles.ticketInfoRow}>
                  <Text style={styles.ticketInfoLabel}>Category:</Text>
                  <Text style={styles.ticketInfoValue}>
                    {selectedTicket.category.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.ticketInfoRow}>
                  <Text style={styles.ticketInfoLabel}>Priority:</Text>
                  <Text style={styles.ticketInfoValue}>
                    {selectedTicket.priority.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.ticketInfoRow}>
                  <Text style={styles.ticketInfoLabel}>Status:</Text>
                  <Text style={styles.ticketInfoValue}>
                    {selectedTicket.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.ticketInfoRow}>
                  <Text style={styles.ticketInfoLabel}>User:</Text>
                  <Text style={styles.ticketInfoValue}>{selectedTicket.userName}</Text>
                </View>
                <View style={styles.ticketInfoRow}>
                  <Text style={styles.ticketInfoLabel}>Assigned to:</Text>
                  <Text style={styles.ticketInfoValue}>
                    {selectedTicket.assignedToName || 'Unassigned'}
                  </Text>
                </View>
                <View style={styles.ticketInfoRow}>
                  <Text style={styles.ticketInfoLabel}>Created:</Text>
                  <Text style={styles.ticketInfoValue}>
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.messagesContainer}>
              <Text style={styles.messagesTitle}>Messages</Text>
              {selectedTicket.messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageItem,
                    message.senderType === 'admin' && styles.messageItemAdmin,
                  ]}
                >
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageSender}>{message.senderName}</Text>
                    <Text style={styles.messageTime}>
                      {new Date(message.timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.messageText}>{message.message}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <View style={styles.messageInput}>
              <TextInput
                style={styles.messageTextInput}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Type your message..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                multiline
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => handleSendMessage(selectedTicket.id)}
              >
                <Icon name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const filteredTickets = getFilteredTickets();

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support Tickets</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalTickets}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{stats.openTickets}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.warning }]}>{stats.inProgressTickets}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.colors.error }]}>{stats.urgentTickets}</Text>
            <Text style={styles.statLabel}>Urgent</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TabButton
            title="All"
            active={activeTab === 'all'}
            onPress={() => setActiveTab('all')}
            badge={tickets.length}
          />
          <TabButton
            title="Open"
            active={activeTab === 'open'}
            onPress={() => setActiveTab('open')}
            badge={tickets.filter(t => t.status === 'open').length}
          />
          <TabButton
            title="In Progress"
            active={activeTab === 'in_progress'}
            onPress={() => setActiveTab('in_progress')}
            badge={tickets.filter(t => t.status === 'in_progress').length}
          />
          <TabButton
            title="Resolved"
            active={activeTab === 'resolved'}
            onPress={() => setActiveTab('resolved')}
            badge={tickets.filter(t => t.status === 'resolved').length}
          />
        </ScrollView>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Icon name="search" size={20} color={theme.colors.onSurfaceVariant} />
          <TextInput
            style={styles.searchTextInput}
            value={filters.search}
            onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
            placeholder="Search tickets..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Icon name="filter-list" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tickets List */}
      <FlatList
        data={filteredTickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TicketCard
            ticket={item}
            onPress={() => handleViewTicket(item)}
            onAssign={() => handleAssignTicket(item.id)}
            onUpdateStatus={(status) => handleUpdateTicketStatus(item.id, status)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {renderTicketModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  tabsContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  badge: {
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
  },
  searchTextInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.onSurface,
    marginLeft: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ticketContent: {
    flex: 1,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  ticketUser: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  ticketStatus: {
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  ticketDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
    lineHeight: 20,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  ticketCategory: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  ticketPriority: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  ticketTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  ticketInfo: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  ticketInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  ticketInfoDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 16,
  },
  ticketInfoMeta: {
    gap: 8,
  },
  ticketInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  ticketInfoValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
  },
  messagesContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  messagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 12,
  },
  messageItem: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  messageItemAdmin: {
    backgroundColor: theme.colors.primary + '20',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  messageTime: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  messageText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
  messageInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  messageTextInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.onSurface,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
