
'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, UserCog, UserX, UserCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useCollection,
  useFirestore,
  updateDocumentNonBlocking,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/firestore/use-memo-firebase';

type UserProfile = {
  id: string;
  email: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  status: 'pending' | 'active' | 'banned';
};

export default function AdminPanel() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const usersCollectionRef = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );

  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useCollection<UserProfile>(usersCollectionRef);

  const handleStatusChange = (
    userId: string,
    newStatus: 'active' | 'banned'
  ) => {
    if (!firestore) return;
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, { status: newStatus });
    toast({
      title: 'User Updated',
      description: `User status has been changed to ${newStatus}.`,
    });
  };

  const sortedUsers = users?.sort(
    (a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)
  );

  return (
    <>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 text-primary mb-4 sm:mb-0">
            <Shield className="h-8 w-8" />
            <h2 className="font-headline text-3xl md:text-4xl font-bold">
              Admin Panel
            </h2>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-lg border">
          <div className="p-6">
            <h3 className="text-2xl font-semibold flex items-center gap-2">
              <UserCog className="h-6 w-6 text-muted-foreground" />
              User Management
            </h3>
            <p className="text-muted-foreground mt-1">
              Manage all registered users in the system.
            </p>
          </div>
          <div className="border-t">
            {usersLoading && (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {usersError && (
              <div className="text-center p-8 text-destructive">
                Error loading users: {usersError.message}
              </div>
            )}
            {!usersLoading && !usersError && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Registered At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers && sortedUsers.length > 0 ? (
                    sortedUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.email}</TableCell>
                        <TableCell>
                          {u.createdAt
                            ? new Date(
                                u.createdAt.seconds * 1000
                              ).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              u.status === 'active'
                                ? 'secondary'
                                : u.status === 'pending'
                                ? 'outline'
                                : 'destructive'
                            }
                          >
                            {u.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {u.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(u.id, 'active')}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Approve
                            </Button>
                          )}
                          {u.status !== 'banned' && u.status !== 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(u.id, 'banned')}
                            >
                              <UserX className="mr-2 h-4 w-4" />
                              Ban
                            </Button>
                          )}
                          {u.status === 'banned' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(u.id, 'active')}
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Unban
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="p-6 border-t text-sm text-muted-foreground">
            <p>Showing {users?.length ?? 0} users.</p>
          </div>
        </div>
      </div>
    </>
  );
}
