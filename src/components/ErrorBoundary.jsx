import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      componentStack: ''
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Extract component stack and file information
    const componentStack = errorInfo.componentStack || '';
    
    this.setState({
      errorInfo: errorInfo,
      componentStack: componentStack
    });

    // You can also log to an error reporting service here
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // This is where you would send errors to an error reporting service
    // like Sentry, LogRocket, etc.
    console.group('🚨 Error Details for Reporting');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
  };

  extractFileInfo = (stack) => {
    if (!stack) return 'Unknown file';
    
    // Try to extract file path and line number from stack trace
    const stackLines = stack.split('\n');
    if (stackLines.length > 1) {
      // The second line usually contains the file information
      const relevantLine = stackLines[1].trim();
      
      // Extract file path and line number
      const fileMatch = relevantLine.match(/(http:\/\/[^:]+):(\d+):(\d+)/);
      if (fileMatch) {
        const filePath = fileMatch[1];
        const lineNumber = fileMatch[2];
        const columnNumber = fileMatch[3];
        
        // Extract just the filename from the full path
        const fileName = filePath.split('/').pop();
        
        return {
          fileName,
          filePath,
          lineNumber,
          columnNumber,
          fullPath: filePath
        };
      }
    }
    
    return {
      fileName: 'Unknown',
      filePath: 'Unknown',
      lineNumber: 'Unknown',
      columnNumber: 'Unknown',
      fullPath: 'Unknown'
    };
  };

  extractComponentInfo = (componentStack) => {
    if (!componentStack) return 'Unknown component';
    
    // Extract component name from component stack
    const firstLine = componentStack.split('\n')[0].trim();
    const componentMatch = firstLine.match(/at\s+(\w+)/);
    
    return componentMatch ? componentMatch[1] : 'Unknown Component';
  };

  renderErrorDetails = () => {
    const { error, errorInfo, componentStack } = this.state;
    
    if (!error) return null;

    const fileInfo = this.extractFileInfo(error.stack);
    const componentName = this.extractComponentInfo(componentStack);

    return (
      <details style={{ 
        marginTop: '1rem', 
        textAlign: 'left',
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '4px',
        padding: '1rem'
      }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#dc3545' }}>
          🐛 Technical Error Details (For Developers)
        </summary>
        
        <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          {/* Error Message */}
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Error Message:</strong>
            <div style={{ 
              background: '#fff', 
              padding: '0.5rem', 
              borderRadius: '4px',
              border: '1px solid #dee2e6',
              marginTop: '0.25rem',
              fontFamily: 'monospace',
              color: '#dc3545'
            }}>
              {error.toString()}
            </div>
          </div>

          {/* Component Information */}
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Component:</strong>
            <div style={{ 
              background: '#fff', 
              padding: '0.5rem', 
              borderRadius: '4px',
              border: '1px solid #dee2e6',
              marginTop: '0.25rem',
              fontFamily: 'monospace'
            }}>
              {componentName}
            </div>
          </div>

          {/* File Information */}
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>File Location:</strong>
            <div style={{ 
              background: '#fff', 
              padding: '0.5rem', 
              borderRadius: '4px',
              border: '1px solid #dee2e6',
              marginTop: '0.25rem',
              fontFamily: 'monospace'
            }}>
              📁 File: <strong>{fileInfo.fileName}</strong><br />
              📍 Line: <strong>{fileInfo.lineNumber}</strong><br />
              🎯 Column: <strong>{fileInfo.columnNumber}</strong><br />
              🔗 Path: {fileInfo.fullPath}
            </div>
          </div>

          {/* Stack Trace */}
          {error.stack && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Stack Trace:</strong>
              <pre style={{ 
                background: '#2d3748', 
                color: '#e2e8f0',
                padding: '0.75rem',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.8rem',
                marginTop: '0.25rem',
                maxHeight: '200px'
              }}>
                {error.stack}
              </pre>
            </div>
          )}

          {/* Component Stack */}
          {componentStack && (
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Component Stack:</strong>
              <pre style={{ 
                background: '#2d3748', 
                color: '#e2e8f0',
                padding: '0.75rem',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.8rem',
                marginTop: '0.25rem',
                maxHeight: '200px'
              }}>
                {componentStack}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          maxWidth: '800px',
          margin: '0 auto',
          fontFamily: 'Arial, sans-serif'
        }}>
          {/* Error Icon */}
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚨</div>
          
          <h1 style={{ color: '#dc3545', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          
          <p style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
            We're working on fixing this issue.
          </p>
          
          <p style={{ 
            marginBottom: '2rem', 
            fontSize: '1rem',
            color: '#6c757d',
            fontStyle: 'italic'
          }}>
            (Dan Allah kudan jiramu kadan muna wani gyara)
          </p>

          {/* Action Buttons */}
          <div style={{ marginBottom: '2rem' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                marginRight: '1rem',
                fontWeight: 'bold'
              }}
            >
              🔄 Reload Page
            </button>
            
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              🏠 Try Again
            </button>
          </div>

          {/* Error Details */}
          {this.renderErrorDetails()}

          {/* Support Information */}
          <div style={{ 
            marginTop: '2rem',
            padding: '1rem',
            background: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            <strong>Need help?</strong> If this error persists, please contact support with the error details above.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;