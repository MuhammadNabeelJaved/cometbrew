/**
 * Database Manager Page
 * Allows admins to view database status, run queries, and manage backups.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Server, 
  RefreshCw, 
  HardDrive, 
  Activity, 
  Shield, 
  Clock, 
  Play, 
  Download, 
  Upload, 
  Search,
  Table as TableIcon,
  Code
} from 'lucide-react';
import { Button } from '../../components/ui/button';

export default function DatabaseManager() {
  const [activeTab, setActiveTab] = useState<'overview' | 'query' | 'backups'>('overview');
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10;');
  const [isExecuting, setIsExecuting] = useState(false);
  
  const tables = [
    { name: 'users', rows: 12450, size: '24 MB' },
    { name: 'projects', rows: 856, size: '12 MB' },
    { name: 'messages', rows: 45200, size: '156 MB' },
    { name: 'files', rows: 3200, size: '4.2 GB' },
    { name: 'logs', rows: 125000, size: '850 MB' },
  ];

  const backups = [
    { id: 1, name: 'backup_daily_2023_10_25.sql', size: '1.2 GB', date: 'Oct 25, 2023 02:00 AM', status: 'success' },
    { id: 2, name: 'backup_daily_2023_10_24.sql', size: '1.2 GB', date: 'Oct 24, 2023 02:00 AM', status: 'success' },
    { id: 3, name: 'backup_weekly_2023_10_22.sql', size: '8.5 GB', date: 'Oct 22, 2023 04:00 AM', status: 'success' },
    { id: 4, name: 'backup_manual_2023_10_20.sql', size: '1.1 GB', date: 'Oct 20, 2023 11:30 AM', status: 'warning' },
  ];

  const handleExecute = () => {
    setIsExecuting(true);
    // Simulate query execution
    setTimeout(() => setIsExecuting(false), 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            Database Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor health, execute queries, and manage backups
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Server className="h-4 w-4" />
            Connect
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Database Size</p>
              <h3 className="text-2xl font-bold mt-2">5.4 GB</h3>
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                +12% this month
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl">
              <HardDrive className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Connections</p>
              <h3 className="text-2xl font-bold mt-2">42</h3>
              <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Peak: 128
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Uptime</p>
              <h3 className="text-2xl font-bold mt-2">99.99%</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Last restart: 14d ago
              </p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Clock className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-xl border border-border/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Security</p>
              <h3 className="text-2xl font-bold mt-2">Secure</h3>
              <p className="text-xs text-purple-500 mt-1 flex items-center gap-1">
                <Shield className="h-3 w-3" />
                SSL Encrypted
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Shield className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-border/50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('query')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'query' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          SQL Query
        </button>
        <button
          onClick={() => setActiveTab('backups')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'backups' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Backups
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Tables List */}
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <TableIcon className="h-4 w-4 text-primary" />
                Database Tables
              </h3>
              <div className="relative">
                <Search className="h-3 w-3 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search tables..." 
                  className="pl-8 pr-4 py-1.5 text-xs bg-muted/50 rounded-lg border-none focus:ring-1 focus:ring-primary w-40"
                />
              </div>
            </div>
            <div className="divide-y divide-border/50">
              {tables.map((table) => (
                <div key={table.name} className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TableIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{table.name}</p>
                      <p className="text-xs text-muted-foreground">{table.rows.toLocaleString()} rows</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">{table.size}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Code className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connection Info */}
          <div className="space-y-6">
            <div className="bg-card border border-border/50 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Connection Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Host</label>
                    <div className="p-2 bg-muted/50 rounded-lg text-sm font-mono border border-border/50">
                      aws-us-east-1.db.example.com
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Port</label>
                    <div className="p-2 bg-muted/50 rounded-lg text-sm font-mono border border-border/50">
                      5432
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Database</label>
                    <div className="p-2 bg-muted/50 rounded-lg text-sm font-mono border border-border/50">
                      production_db
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">User</label>
                    <div className="p-2 bg-muted/50 rounded-lg text-sm font-mono border border-border/50">
                      admin_user
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">SSL Certificate</p>
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 text-green-500 text-xs rounded-lg border border-green-500/20">
                    <Shield className="h-3 w-3" />
                    Certificate is valid (Expires in 85 days)
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/20 rounded-2xl p-6">
              <h3 className="font-semibold text-primary mb-2">System Status</h3>
              <p className="text-sm text-muted-foreground mb-4">
                All systems are operational. Database latency is normal (24ms).
              </p>
              <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden">
                <div className="h-full w-[92%] bg-gradient-to-r from-primary to-purple-500 rounded-full" />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>CPU: 45%</span>
                <span>RAM: 6.2GB / 8GB</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Query Tab */}
      {activeTab === 'query' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-3 bg-muted/30 border-b border-border/50 flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">SQL Query Editor</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs">Clear</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs">History</Button>
              </div>
            </div>
            <div className="p-4">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-40 bg-muted/30 font-mono text-sm p-4 rounded-xl border border-border/50 focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none"
                spellCheck="false"
              />
            </div>
            <div className="p-3 bg-muted/30 border-t border-border/50 flex justify-end">
              <Button onClick={handleExecute} disabled={isExecuting} className="gap-2">
                {isExecuting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Query
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-8 text-center">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg">Query Results</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mt-2">
              Execute a query above to see the results here. The results will be displayed in a table format.
            </p>
          </div>
        </motion.div>
      )}

      {/* Backups Tab */}
      {activeTab === 'backups' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
             <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                 <h3 className="font-semibold text-lg">Database Backups</h3>
                 <p className="text-sm text-muted-foreground">Manage automated and manual backups</p>
               </div>
               <Button className="gap-2">
                 <Upload className="h-4 w-4" />
                 Create Backup
               </Button>
             </div>
             
             <div className="divide-y divide-border/50">
               {backups.map((backup) => (
                 <div key={backup.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                   <div className="flex items-center gap-4">
                     <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                       backup.status === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                     }`}>
                       <Database className="h-5 w-5" />
                     </div>
                     <div>
                       <p className="font-medium text-sm text-foreground">{backup.name}</p>
                       <div className="flex items-center gap-3 mt-1">
                         <span className="text-xs text-muted-foreground flex items-center gap-1">
                           <Clock className="h-3 w-3" /> {backup.date}
                         </span>
                         <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                           {backup.size}
                         </span>
                       </div>
                     </div>
                   </div>
                   <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" className="gap-2">
                       <Download className="h-3 w-3" />
                       Download
                     </Button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}