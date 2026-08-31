/**
 * useBluetoothPrinter.js - Hook para impresora térmica Bluetooth/TCP
 * Maneja la conexión y generación de tickets en formato ESC/POS
 * 
 * Funciones principales:
 * - connectBluetooth(): Conectar a impresora Bluetooth
 * - connectTCP(): Conectar a impresora por red
 - formatTicket(): Generar texto en formato ESC/POS
 * - printTicket(): Enviar ticket a la impresora
 */

const useBluetoothPrinter = () => {
  const [printerConnected, setPrinterConnected] = useState(false);
  const [printerStatus, setPrinterStatus] = useState('desconocido');
  const [deviceId, setDeviceId] = useState(null);
  websocket = null;

  /**
   * Escanear y conectar a impresora Bluetooth
   * @param {string} deviceName - Nombre de la impresora (ej: "Star TSP650")
   */
  const connectBluetooth = async (deviceName) => {
    try {
      // Solicitar permiso de Bluetooth si es necesario
      if (!navigator.bluetooth) {
        console.error('Bluetooth no soportado en este navegador');
        setPrinterStatus('Bluetooth no soportado');
        return false;
      }

      // Escanear dispositivos
      const devices = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        filters: [{ name: deviceName }]
      });

      if (devices) {
        setDeviceId(devices.id);
        
        // Creir socket de RFCOMM
        const server = await devices.gatt.connect();
        const service = await server.getPrimaryService('1101'); // SPP UUID
        const characteristic = await service.getCharacteristic('1102'); // Write characteristic
        
        // Guardar referencia para impresión
        websocket = characteristic;
        setPrinterConnected(true);
        setPrinterStatus('Conectado via Bluetooth');
        
        return true;
      }
    } catch (error) {
      console.error('Error conectando Bluetooth:', error);
      setPrinterStatus('Error de conexión Bluetooth');
      return false;
    }
  };

  /**
   * Conectar a impresora por TCP/IP
   * @param {string} host - Dirección IP de la impresora
   * @param {number} port - Puerto (9100 es estándar)
   */
  const connectTCP = async (host, port = 9100) => {
    try {
      const socket = new WebSocket(`ws://${host}:${port}`);
      
      socket.onopen = () => {
        console.log('Conexión TCP establecida');
        setPrinterConnected(true);
        setPrinterStatus('Conectado via TCP');
      };

      socket.onerror = (error) => {
        console.error('Error TCP:', error);
        setPrinterConnected(false);
        setPrinterStatus('Error de conexión TCP');
      };

      socket.onclose = () => {
        setPrinterConnected(false);
        setPrinterStatus('Desconectado');
      };

      // Guardar referencia
      websocket = socket;
      
      return true;
    } catch (error) {
      console.error('Error conectando TCP:', error);
      setPrinterStatus('Error de conexión TCP');
      return false;
    }
  };

  /**
   * Formatear ticket en formato ESC/POS
   * @param {object} ticketData - Datos de la venta/pedido
   * @returns {Uint8Array} - Comando ESC/POS listo para imprimir
   */
  const formatTicket = (ticketData) => {
    const lines = [];
    
    // Header - La Barrita de Carnitas
    lines.push(0x1B, 0x21, 0x03); // Triple width + height
    lines.push(...String.fromCharCode(0x4c, 0x41, 0x20, 0x42, 0x41, 0x52, 0x52, 0x49, 0x54, 0x5f, 0x44, 0x41, 0x54, 0x41, 0x20).charCodeAt());
    
    lines.push(0x1B, 0x21, 0x00); // Return to normal size
    lines.push(...'LA BARRITA DE CARNITAS'.split('').map(c => c.charCodeAt(0)));
    lines.push(0x0A); // New line
    
    // Venta info
    lines.push(0x1B, 0x4B, 65); // Fuente grande para número de venta
    lines.push(...`Venta #${ticketData.numero_venta || '001'}`.split('').map(c => c.charCodeAt(0)));
    lines.push(0x0A);
    
    lines.push(0x1B, 0x4B, 0); // Fuente normal
    lines.push(...new Date(ticketData.fecha).toLocaleString().split('').map(c => c.charCodeAt(0)));
    lines.push(0x0A);
    lines.push(0x0A);
    
    // Tabla headers
    lines.push(0x1B, 0x6D, 0); // Desactivar modo denso
    lines.push(...'PRODUCTO'.split('').map(c => c.charCodeAt(0)));
    lines.push(0x09, 0x09); // Tabulación para CANT
    lines.push(...'CANT'.split('').map(c => c.charCodeAt(0)));
    lines.push(0x09); // Tabulación
    lines.push(...'PRECIO'.split('').map(c => c.charCodeAt(0)));
    lines.push(0x0A);
    
    // Items
    const items = ticketData.items || [];
    items.forEach((item, index) => {
      // Producto (left-aligned)
      lines.push(...item.producto.split('').map(c => c.charCodeAt(0)));
      // Padding
      const padding = 20 - item.producto.length;
      for (let i = 0; i < padding; i++) lines.push(0x20);
      
      // Cantidad
      lines.push(0x09); // Tab
      const cantText = item.cantidad.toString();
      lines.push(...cantText.split('').map(c => c.charCodeAt(0)));
      
      // Precio
      lines.push(0x09); // Tab
      const precioText = `$${item.precio_unitario.toFixed(2)}`;
      lines.push(...precioText.split('').map(c => c.charCodeAt(0)));
      
      lines.push(0x0A);
    });
    
    // Total
    lines.push(0x1B, 0x4B, 65); // Fuente grande
    lines.push(...'TOTAL:'.split('').map(c => c.charCodeAt(0)));
    lines.push(0x09, 0x09); // Tab grande
    lines.push(...`$${ticketData.total || 0}`.split('').map(c => c.charCodeAt(0)));
    lines.push(0x0A);
    
    lines.push(0x1B, 0x4B, 0); // Fuente normal
    lines.push(...'Pago:'.split('').map(c => c.charCodeAt(0)));
    lines.push(0x09);
    lines.push(...(ticketData.tipo_pago || 'Efectivo').split('').map(c => c.charCodeAt(0)));
    lines.push(0x0A);
    
    lines.push(0x1B, 0x69); // Cortar papel
    lines.push(0x0A);
    
    return Uint8Array.from(lines);
  };

  /**
   * Imprimir ticket enviado
   * @param {Uint8Array} ticketData - Datos formateados en ESC/POS
   */
  const printTicket = async (ticketData) => {
    const formatted = formatTicket(ticketData);
    
    if (websocket && printerConnected) {
      try {
        if (websocket instanceof WebSocket) {
          // Conexión TCP/WebSocket
          websocket.send(formatted);
        } else if (typeof websocket.write === 'function') {
          // Bluetooth characteristic
          websocket.write(formatted);
        }
        console.log('Ticket enviado a impresora');
        return true;
      } catch (error) {
        console.error('Error imprimiendo ticket:', error);
        setPrinterStatus('Error al imprimir');
        return false;
      }
    } else {
      console.error('Impresora no conectada');
      setPrinterStatus('Impresora no conectada');
      return false;
    }
  };

  /**
   * Desconectar impresora
   */
  const disconnect = () => {
    if (websocket) {
      if (websocket.close) {
        websocket.close();
      }
      if (websocket.disconnect) {
        websocket.disconnect();
      }
    }
    setPrinterConnected(false);
    setPrinterStatus('Desconectado');
    setDeviceId(null);
  };

  return {
    printerConnected,
    printerStatus,
    deviceId,
    connectBluetooth,
    connectTCP,
    formatTicket,
    printTicket,
    disconnect,
    websocket
  };
};

export default useBluetoothPrinter;