/**
 * Admin Settings Page
 * Manage application and account settings
 */
import React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { User, Lock, Bell, Globe, Shield } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <Button>Save Changes</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Settings Navigation */}
        <div className="md:col-span-3 space-y-1">
          <nav className="flex flex-col space-y-1">
            <button className="flex items-center space-x-3 px-3 py-2 rounded-md bg-secondary/50 text-secondary-foreground font-medium">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </button>
            <button className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground font-medium transition-colors">
              <Lock className="h-4 w-4" />
              <span>Security</span>
            </button>
            <button className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground font-medium transition-colors">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </button>
            <button className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground font-medium transition-colors">
              <Globe className="h-4 w-4" />
              <span>Language & Region</span>
            </button>
            <button className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground font-medium transition-colors">
              <Shield className="h-4 w-4" />
              <span>API Keys</span>
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="md:col-span-9 space-y-6">
          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                  JD
                </div>
                <div>
                  <Button variant="outline" size="sm">Change Avatar</Button>
                  <p className="text-xs text-muted-foreground mt-1">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input defaultValue="John" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input defaultValue="Doe" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input defaultValue="john.doe@nova.agency" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="Senior Full-Stack Developer at Nova Agency."
                />
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Preferences</h2>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive emails about new messages and project updates</p>
                </div>
                <div className="h-6 w-11 bg-primary rounded-full relative">
                  <div className="absolute right-1 top-1 h-4 w-4 bg-white rounded-full"></div>
                </div>
               </div>
               <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Desktop Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive push notifications on your desktop</p>
                </div>
                <div className="h-6 w-11 bg-muted rounded-full relative">
                   <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full"></div>
                </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}