/**
 * User Profile Page
 * Account management including personal details, security, and payment methods.
 */
import React from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { User, Lock, CreditCard, Bell, Save, Shield } from 'lucide-react';

export default function UserProfile() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your profile, security, and billing details.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 rounded-xl">
          <TabsTrigger value="profile" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Profile</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Security</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Billing</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-blue-600 p-[2px]">
                  <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100" alt="Profile" className="h-full w-full object-cover" />
                  </div>
                </div>
                <div>
                  <Button variant="outline" size="sm" className="mr-2">Change Avatar</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">Remove</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Alex" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Morgan" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue="alex.morgan@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2">
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>Manage your password and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current">Current Password</Label>
                  <Input id="current" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new">New Password</Label>
                  <Input id="new" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm New Password</Label>
                  <Input id="confirm" type="password" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-border/50">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-500" /> Two-Factor Authentication
                </h3>
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-secondary/10">
                    <div>
                        <p className="font-medium text-sm">Secure your account</p>
                        <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                    </div>
                    <Button variant="outline" size="sm">Enable 2FA</Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="gap-2">Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
             <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your credit cards and billing information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Saved Card */}
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 relative overflow-hidden group">
                        <div className="flex justify-between items-start mb-8">
                             <CreditCard className="h-6 w-6 text-primary" />
                             <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded">Primary</span>
                        </div>
                        <div className="mb-4">
                            <p className="font-mono text-lg tracking-wider">•••• •••• •••• 4242</p>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Expires 12/24</span>
                            <span>Visa</span>
                        </div>
                    </div>

                    {/* Add New Card */}
                     <div className="p-4 rounded-xl border border-border border-dashed flex flex-col items-center justify-center min-h-[160px] cursor-pointer hover:bg-secondary/50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mb-2">
                            <CreditCard className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="font-medium text-sm">Add New Card</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-medium">Billing History</h3>
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex justify-between items-center p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                        $
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Invoice #INV-00{i}</p>
                                        <p className="text-xs text-muted-foreground">Oct {20 - i}, 2023</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">$1,200.00</p>
                                    <p className="text-xs text-green-500">Paid</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications Tab */}
        <TabsContent value="notifications">
           <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {['Project Updates', 'New Messages', 'Marketing Emails', 'Security Alerts'].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2">
                        <div className="space-y-0.5">
                            <Label className="text-base">{item}</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications about {item.toLowerCase()}.</p>
                        </div>
                        <div className="flex items-center h-6">
                            {/* Using checkbox as toggle for now or switch if available */}
                            <input type="checkbox" defaultChecked className="toggle" /> 
                        </div>
                    </div>
                ))}
                
                <div className="flex justify-end pt-4">
                     <Button>Save Preferences</Button>
                </div>
            </CardContent>
           </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}