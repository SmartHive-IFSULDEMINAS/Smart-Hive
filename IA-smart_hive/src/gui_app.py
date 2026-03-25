# -*- coding: utf-8 -*-
"""
SmartHive - GUI Application
Scientific Data Collector for pollen spectral analysis.

Usage:
    python src/gui_app.py
"""

import sys
import os

# Add project root to path for imports
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# Fix TCL/TK path for Windows (auto-detection)
if sys.platform == "win32":
    import sys
    python_path = os.path.dirname(sys.executable)
    tcl_path = os.path.join(python_path, "tcl", "tcl8.6")
    tk_path = os.path.join(python_path, "tcl", "tk8.6")
    if os.path.exists(tcl_path):
        os.environ['TCL_LIBRARY'] = tcl_path
        os.environ['TK_LIBRARY'] = tk_path

import customtkinter as ctk
import serial
import serial.tools.list_ports
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import csv
import joblib
import glob
import time
import numpy as np
import traceback

from src.config import (
    MODELS_DIR, DATASETS_DIR, DATASET_FILE,
    SENSOR_COLUMNS, SENSOR_COLORS_GUI, SENSOR_Y_LIMIT,
    BAUD_RATE, THEME,
    ensure_directories
)

# GUI Theme
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("dark-blue")


class SmartHiveApp(ctk.CTk):
    """Main application window for SmartHive data collection."""
    
    def __init__(self):
        super().__init__()
        
        self.title("SmartHive - Scientific Data Collector v11.0")
        self.geometry("1300x850")
        
        # Ensure required directories exist
        ensure_directories()
        
        # Serial connection
        self.ser = None
        self.lendo_dados = False
        self.pausar_leitura = False
        
        # Sensor data
        self.baseline = [0] * 10
        self.dados_grafico = [0] * 10
        self.ultimo_raw = [0] * 10
        
        # State
        self.modo_tara = False
        self.ver_porcentagem = False
        self.ultimo_envio_brilho = 0
        self.contador_amostras = 0
        self.luz_ligada = False
        self.app_rodando = True
        
        # AI Model
        self.model = None
        self.normalizer = None
        self.current_model_name = ""
        
        # Load normalizer if available
        self._load_normalizer()
        self.class_result = "--"
        
        # Layout
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)
        
        self._setup_sidebar()
        self._setup_main_area()
        
        self.protocol("WM_DELETE_WINDOW", self._on_closing)
        self._loop_leitura()
    
    # =========================================================================
    # SETUP METHODS
    # =========================================================================
    
    def _setup_sidebar(self):
        """Create the sidebar with controls."""
        self.sidebar = ctk.CTkFrame(self, width=340, corner_radius=0, 
                                     fg_color=THEME['sidebar'])
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        self.sidebar.pack_propagate(False)
        
        # Logo
        frame_logo = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        frame_logo.pack(pady=(20, 10), padx=20, fill="x")
        
        ctk.CTkLabel(frame_logo, text="SMART HIVE", 
                     font=ctk.CTkFont(size=24, weight="bold"),
                     text_color="white").pack(anchor="w")
        ctk.CTkLabel(frame_logo, text="SCIENTIFIC DATASET TOOL", 
                     font=ctk.CTkFont(size=12, weight="bold"),
                     text_color="gray").pack(anchor="w")
        
        # Scrollable container
        self.scroll_frame = ctk.CTkScrollableFrame(self.sidebar, fg_color="transparent")
        self.scroll_frame.pack(fill="both", expand=True, padx=5, pady=5)
        
        # Cards
        self._create_connectivity_card()
        self._create_parameters_card()
        self._create_labeling_card()
        self._create_ai_card()
        
        # Status (fixed at bottom)
        self._create_status_bar()
    
    def _create_connectivity_card(self):
        """Create connectivity controls card."""
        card = ctk.CTkFrame(self.scroll_frame, fg_color=THEME['card'], corner_radius=10)
        card.pack(padx=10, pady=5, fill="x")
        
        ctk.CTkLabel(card, text="🔌 CONECTIVIDADE", 
                     font=ctk.CTkFont(size=11, weight="bold"),
                     text_color="gray").pack(padx=10, pady=(5, 5), anchor="w")
        
        frame_portas = ctk.CTkFrame(card, fg_color="transparent")
        frame_portas.pack(padx=10, pady=2, fill="x")
        
        self.combo_portas = ctk.CTkOptionMenu(frame_portas, values=self._listar_portas(), height=28)
        self.combo_portas.pack(side="left", fill="x", expand=True)
        
        ctk.CTkButton(frame_portas, text="🔄", width=30, height=28,
                      command=self._atualizar_lista_portas,
                      fg_color="#444").pack(side="right", padx=(5, 0))
        
        self.btn_conectar = ctk.CTkButton(card, text="CONECTAR",
                                           command=self._conectar_serial,
                                           height=32, font=ctk.CTkFont(weight="bold"))
        self.btn_conectar.pack(padx=10, pady=(5, 10), fill="x")
    
    def _create_parameters_card(self):
        """Create parameters controls card."""
        card = ctk.CTkFrame(self.scroll_frame, fg_color=THEME['card'], corner_radius=10)
        card.pack(padx=10, pady=5, fill="x")
        
        ctk.CTkLabel(card, text="⚙️ PARÂMETROS",
                     font=ctk.CTkFont(size=11, weight="bold"),
                     text_color="gray").pack(padx=10, pady=(5, 5), anchor="w")
        
        self.check_flash = ctk.CTkCheckBox(card, text="Modo Flash (Auto)",
                                            font=ctk.CTkFont(weight="bold"))
        self.check_flash.pack(padx=10, pady=2, anchor="w")
        
        self.slider_brilho = ctk.CTkSlider(card, from_=4, to=100,
                                            command=self._mudar_brilho)
        self.slider_brilho.set(20)
        self.slider_brilho.pack(padx=10, pady=5, fill="x")
        
        self.btn_luz = ctk.CTkButton(card, text="Luz Manual (Foco)",
                                      command=self._toggle_luz_manual,
                                      fg_color="transparent", border_width=1,
                                      border_color="gray", text_color="silver", height=28)
        self.btn_luz.pack(padx=10, pady=(5, 10), fill="x")
    
    def _create_labeling_card(self):
        """Create data labeling controls card."""
        card = ctk.CTkFrame(self.scroll_frame, fg_color=THEME['card'], corner_radius=10)
        card.pack(padx=10, pady=5, fill="x")
        
        ctk.CTkLabel(card, text="🏷️ ROTULAGEM",
                     font=ctk.CTkFont(size=11, weight="bold"),
                     text_color="gray").pack(padx=10, pady=(5, 5), anchor="w")
        
        self.entry_especie = ctk.CTkEntry(card, placeholder_text="Espécie (Ex: Café)", height=28)
        self.entry_especie.pack(padx=10, pady=2, fill="x")
        
        self.entry_tipo = ctk.CTkEntry(card, placeholder_text="Tipo", height=28)
        self.entry_tipo.pack(padx=10, pady=2, fill="x")
        
        self.entry_nota = ctk.CTkEntry(card, placeholder_text="Notas", height=28)
        self.entry_nota.pack(padx=10, pady=(2, 10), fill="x")
        
        self.btn_salvar = ctk.CTkButton(card, text="SALVAR AMOSTRA",
                                         command=self._salvar_com_flash,
                                         fg_color=THEME['accent'],
                                         font=ctk.CTkFont(weight="bold"), height=35)
        self.btn_salvar.pack(padx=10, pady=(5, 15), fill="x")
    
    def _create_ai_card(self):
        """Create AI analysis controls card."""
        card = ctk.CTkFrame(self.scroll_frame, fg_color=THEME['card'], corner_radius=10)
        card.pack(padx=10, pady=5, fill="x")
        
        ctk.CTkLabel(card, text="🧠 ANÁLISE IA",
                     font=ctk.CTkFont(size=11, weight="bold"),
                     text_color="gray").pack(padx=10, pady=(5, 5), anchor="w")
        
        self.combo_models = ctk.CTkOptionMenu(card, values=self._listar_modelos(),
                                               command=self._carregar_modelo_selecionado)
        self.combo_models.set("Selecione Modelo...")
        self.combo_models.pack(padx=10, pady=5, fill="x")
        
        self.lbl_prediction = ctk.CTkLabel(card, text="JUIZ: --",
                                            font=ctk.CTkFont(size=16, weight="bold"),
                                            text_color=THEME['accent'])
        self.lbl_prediction.pack(padx=10, pady=(10, 15), anchor="center")
    
    def _create_status_bar(self):
        """Create status bar at bottom of sidebar."""
        frame_status = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        frame_status.pack(padx=15, pady=(5, 15), side="bottom", fill="x")
        
        self.lbl_contador = ctk.CTkLabel(frame_status, text="Amostras Totais: 0",
                                          font=ctk.CTkFont(weight="bold"))
        self.lbl_contador.pack(anchor="w")
        
        self.lbl_status = ctk.CTkLabel(frame_status, text="Aguardando conexão...",
                                        text_color="gray", wraplength=280,
                                        justify="left", font=ctk.CTkFont(size=12))
        self.lbl_status.pack(anchor="w")
    
    def _setup_main_area(self):
        """Create the main graph area."""
        self.main_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.main_frame.grid(row=0, column=1, sticky="nsew", padx=20, pady=20)
        
        # Toolbar
        toolbar = ctk.CTkFrame(self.main_frame, height=50, 
                               fg_color=THEME['card'], corner_radius=10)
        toolbar.pack(fill="x", pady=(0, 15))
        
        self.btn_tara = ctk.CTkButton(toolbar, text="DEFINIR TARA",
                                       command=self._tarar_com_flash,
                                       fg_color=THEME['warning'], text_color="black",
                                       font=ctk.CTkFont(weight="bold"), width=120)
        self.btn_tara.pack(side="left", padx=15, pady=10)
        
        ctk.CTkButton(toolbar, text="RESETAR", command=self._resetar_tara,
                      fg_color="transparent", border_width=1, border_color="gray",
                      width=80).pack(side="left", padx=5, pady=10)
        
        self.btn_vis_mode = ctk.CTkButton(toolbar, text="Modo: Automático (Zoom)",
                                           command=self._toggle_visualizacao,
                                           fg_color="#8E44AD", width=200)
        self.btn_vis_mode.pack(side="right", padx=15, pady=10)
        
        # Graph container
        self.graph_container = ctk.CTkFrame(self.main_frame, fg_color=THEME['card'],
                                             corner_radius=10)
        self.graph_container.pack(fill="both", expand=True)
        self._criar_grafico()
    
    # =========================================================================
    # SERIAL COMMUNICATION
    # =========================================================================
    
    def _listar_portas(self):
        """List available serial ports."""
        ports = [p.device for p in serial.tools.list_ports.comports()]
        return ports if ports else ["Nenhuma"]
    
    def _atualizar_lista_portas(self):
        """Refresh the port list."""
        portas = self._listar_portas()
        self.combo_portas.configure(values=portas)
        self.combo_portas.set(portas[0])
    
    def _conectar_serial(self):
        """Connect to the selected serial port."""
        try:
            porta = self.combo_portas.get()
            if porta in ("Nenhuma", ""):
                self.lbl_status.configure(text="⚠️ Selecione uma porta válida!",
                                          text_color=THEME['warning'])
                return
            
            if self.ser:
                self.ser.close()
            
            self.ser = serial.Serial(porta, BAUD_RATE, timeout=1)
            time.sleep(2)  # Wait for Arduino reset
            
            self._enviar_cmd('0')
            self.lbl_status.configure(text=f"✅ Conectado em {porta}",
                                      text_color=THEME['success'])
            self.btn_conectar.configure(text="DESCONECTAR", fg_color=THEME['error'],
                                        command=self._desconectar)
            self.lendo_dados = True
            
        except Exception as e:
            print(f"CONNECTION ERROR: {e}")
            self.lbl_status.configure(text=f"❌ Erro: {str(e)[:30]}...",
                                      text_color=THEME['error'])
    
    def _desconectar(self):
        """Disconnect from serial port."""
        self.lendo_dados = False
        self._enviar_cmd('0')
        if self.ser:
            self.ser.close()
        self.lbl_status.configure(text="Dispositivo desconectado", text_color="gray")
        self.btn_conectar.configure(text="CONECTAR", fg_color=THEME['accent'],
                                    command=self._conectar_serial)
    
    def _enviar_cmd(self, cmd: str):
        """Send command to Arduino."""
        if self.ser:
            self.ser.write((cmd + '\n').encode())
    
    def _mudar_brilho(self, value):
        """Change LED brightness."""
        if time.time() - self.ultimo_envio_brilho > 0.1:
            self._enviar_cmd(f"B{int(value)}")
            self.ultimo_envio_brilho = time.time()
    
    def _toggle_luz_manual(self):
        """Toggle manual LED."""
        self.luz_ligada = not self.luz_ligada
        if self.luz_ligada:
            self._enviar_cmd('1')
            self.btn_luz.configure(text="DESLIGAR LUZ", fg_color=THEME['error'],
                                   text_color="white", border_width=0)
        else:
            self._enviar_cmd('0')
            self.btn_luz.configure(text="Luz Manual (Foco)", fg_color="transparent",
                                   text_color="silver", border_width=1)
    
    # =========================================================================
    # DATA HANDLING
    # =========================================================================
    
    def _executar_flash_e_ler(self):
        """Execute flash and read sensor data."""
        self.pausar_leitura = True
        precisa_desligar = False
        self.update()
        
        if not self.luz_ligada:
            self._enviar_cmd('1')
            precisa_desligar = True
            time.sleep(0.3)
            self.update()
        
        if self.ser:
            self.ser.reset_input_buffer()
        
        leitura = [0] * 10
        try:
            for _ in range(5):
                line = self.ser.readline().decode('latin-1').strip()
                vals = line.split(',')
                if len(vals) >= 10:
                    leitura = []
                    for v in vals[:10]:
                        try:
                            leitura.append(float(v))
                        except:
                            leitura.append(0)
                    break
        except:
            pass
        
        if precisa_desligar:
            self._enviar_cmd('0')
        self.pausar_leitura = False
        return leitura
    
    def _aplicar_tara(self, raw_data):
        """Apply baseline correction."""
        if not self.modo_tara:
            return raw_data
        return [max(1, r - b) for r, b in zip(raw_data, self.baseline)]
    
    def _salvar_com_flash(self):
        """Save sample with flash."""
        if not self.ser:
            self.lbl_status.configure(text="⚠️ Conecte o dispositivo primeiro!",
                                      text_color=THEME['warning'])
            return
        
        if self.check_flash.get() == 1:
            self.lbl_status.configure(text="📸 FLASH DISPARADO...",
                                      text_color=THEME['warning'])
            self.update()
            dados_brutos = self._executar_flash_e_ler()
        else:
            dados_brutos = list(self.ultimo_raw)
        
        dados_limpos = self._aplicar_tara(dados_brutos)
        self.dados_grafico = dados_limpos
        self._atualizar_barras_grafico()
        
        if max(dados_brutos) > 65000:
            self.lbl_status.configure(text="⚠️ CUIDADO: DADOS SATURADOS!",
                                      text_color=THEME['saturation'])
        
        self._gravar_csv(dados_limpos)
        self.entry_nota.delete(0, 'end')
    
    def _tarar_com_flash(self):
        """Set baseline with flash."""
        if not self.ser:
            return
        
        if self.check_flash.get() == 1:
            self.lbl_status.configure(text="⚖️ CALIBRANDO...",
                                      text_color=THEME['warning'])
            self.update()
            self.baseline = self._executar_flash_e_ler()
        else:
            self.baseline = list(self.ultimo_raw)
        
        self.modo_tara = True
        self.lbl_status.configure(text="✅ TARA DEFINIDA COM SUCESSO!",
                                  text_color=THEME['success'])
    
    def _resetar_tara(self):
        """Reset baseline."""
        self.baseline = [0] * 10
        self.modo_tara = False
        self.lbl_status.configure(text="Modo Bruto (Resetado)", text_color="gray")
    
    def _gravar_csv(self, dados):
        """Save data to CSV file."""
        especie = self.entry_especie.get()
        if not especie:
            self.lbl_status.configure(text="❌ ERRO: Digite o nome da Espécie!",
                                      text_color=THEME['error'])
            return
        
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        tipo = self.entry_tipo.get()
        nota = self.entry_nota.get()
        
        dataset_path = DATASETS_DIR / DATASET_FILE
        
        try:
            file_exists = dataset_path.exists()
            with open(dataset_path, mode='a', newline='') as file:
                writer = csv.writer(file)
                if not file_exists:
                    writer.writerow(['Timestamp', 'Especie', 'Tipo', 'Nota',
                                     'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8',
                                     'NIR', 'Clear'])
                writer.writerow([ts, especie, tipo, nota] + [int(x) for x in dados])
            
            self.contador_amostras += 1
            self.lbl_contador.configure(text=f"Amostras Totais: {self.contador_amostras}")
            self.lbl_status.configure(text=f"✅ SALVO: {especie} em {ts}",
                                      text_color=THEME['success'])
            
            # Visual feedback
            self.btn_salvar.configure(fg_color="white", text_color=THEME['accent'])
            self.after(200, lambda: self.btn_salvar.configure(
                fg_color=THEME['accent'], text_color="white"))
            
        except Exception as e:
            self.lbl_status.configure(text=f"Erro IO: {e}", text_color=THEME['error'])
    
    # =========================================================================
    # AI / ML
    # =========================================================================
    
    def _load_normalizer(self):
        """Load the normalizer model."""
        try:
            path = MODELS_DIR / "normalizer.pkl"
            if path.exists():
                self.normalizer = joblib.load(path)
                print("Normalizer loaded.")
            else:
                print("Normalizer not found (OK for data collection)")
        except Exception as e:
            print(f"Error loading normalizer: {e}")
    
    def _listar_modelos(self):
        """List available models."""
        files = list(MODELS_DIR.glob("*.pkl"))
        models = [f.name for f in files if f.name != "normalizer.pkl"]
        return models if models else ["Nenhum modelo"]
    
    def _carregar_modelo_selecionado(self, model_name: str):
        """Load selected model."""
        if model_name == "Nenhum modelo":
            return
        try:
            path = MODELS_DIR / model_name
            self.model = joblib.load(path)
            self.current_model_name = model_name
            self.lbl_status.configure(text=f"🧠 Modelo Carregado: {model_name}",
                                      text_color=THEME['success'])
            print(f"Model {model_name} loaded.")
        except Exception as e:
            self.lbl_status.configure(text=f"Erro ao carregar modelo: {e}",
                                      text_color=THEME['error'])
            print(f"Error: {e}")
    
    def _realizar_predicao(self, raw_data):
        """Make prediction with loaded model."""
        if not self.model or not self.normalizer or not self.lendo_dados:
            self.class_result = "--"
            self.lbl_prediction.configure(text="JUIZ: --")
            return
        
        try:
            X_raw = np.array(raw_data).reshape(1, -1)
            X_norm = self.normalizer.transform(X_raw)
            
            if hasattr(self.model, "predict"):
                pred = self.model.predict(X_norm)[0]
                
                if "kmeans" in self.current_model_name.lower():
                    text_res = f"CLUSTER {pred}"
                elif "knn" in self.current_model_name.lower():
                    text_res = f"TIPO: {pred}"
                else:
                    text_res = str(pred)
            else:
                text_res = "?"
            
            self.lbl_prediction.configure(text=text_res)
            
        except Exception as e:
            print(f"Prediction Error: {e}")
    
    # =========================================================================
    # VISUALIZATION
    # =========================================================================
    
    def _toggle_visualizacao(self):
        """Toggle visualization mode."""
        self.ver_porcentagem = not self.ver_porcentagem
        if self.ver_porcentagem:
            self.btn_vis_mode.configure(text="Modo: Porcentagem (%)", fg_color="gray")
            self.ax.set_ylim(0, 1.05)
            self.ax.set_title('ASSINATURA ESPECTRAL (NORMALIZADO %)',
                              color='#8E44AD', fontsize=10, weight='bold')
        else:
            self.btn_vis_mode.configure(text="Modo: Automático (Zoom)", fg_color="#8E44AD")
            self.ax.set_title('ASSINATURA ESPECTRAL (ABSOLUTO)',
                              color='white', fontsize=10, weight='bold')
        self._atualizar_barras_grafico()
    
    def _atualizar_barras_grafico(self):
        """Update graph bars with current data."""
        dados_visuais = list(self.dados_grafico)
        saturado = max(dados_visuais) > 65000
        
        if saturado:
            self.ax.set_title('⚠️ SENSOR SATURADO! DADOS INVÁLIDOS',
                              color=THEME['saturation'], weight='bold')
        
        # Remove old text labels safely
        for t in list(self.ax.texts):
            t.remove()
        
        if self.ver_porcentagem:
            cores = dados_visuais[0:8]
            soma_cores = sum(cores)
            if soma_cores < 500:
                dados_finais = [0] * 10
                self.ax.set_title('Sinal Fraco (Aproxime da Amostra)',
                                  color='gray', fontsize=9)
            else:
                cores_norm = [c / soma_cores for c in cores]
                dados_finais = cores_norm + [0, 0]
                if not saturado:
                    self.ax.set_title('DISTRIBUIÇÃO DE COR (%)',
                                      color='#8E44AD', fontsize=10, weight='bold')
        else:
            dados_finais = dados_visuais
            maior_valor = max(dados_finais)
            if maior_valor < 100:
                maior_valor = 100
            self.ax.set_ylim(0, maior_valor * 1.2)
            if not saturado:
                self.ax.set_title('ESPECTRO ABSOLUTO', color='#aaaaaa', fontsize=10)
        
        for i, (rect, h) in enumerate(zip(self.bars, dados_finais)):
            rect.set_height(h)
            if not self.ver_porcentagem and h > 65000:
                rect.set_color(THEME['saturation'])
            else:
                rect.set_color(SENSOR_COLORS_GUI[i])
            if h > 0:
                texto_valor = f"{h:.2f}" if self.ver_porcentagem else f"{int(h)}"
                self.ax.text(rect.get_x() + rect.get_width()/2., h, texto_valor,
                             ha='center', va='bottom', color='white', fontsize=8)
        
        self.canvas.draw_idle()
    
    def _criar_grafico(self):
        """Create the matplotlib graph."""
        plt.style.use('dark_background')
        self.fig, self.ax = plt.subplots(figsize=(8, 5), dpi=100)
        self.fig.patch.set_facecolor(THEME['card'])
        self.ax.set_facecolor(THEME['card'])
        self.fig.subplots_adjust(left=0.08, right=0.95, top=0.90, bottom=0.15)
        
        labels = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'NIR', 'Clear']
        self.bars = self.ax.bar(labels, [1]*10, color=SENSOR_COLORS_GUI,
                                 width=0.6, edgecolor=THEME['card'], linewidth=0.5)
        
        self.ax.set_ylim(0, SENSOR_Y_LIMIT)
        self.ax.spines['top'].set_visible(False)
        self.ax.spines['right'].set_visible(False)
        self.ax.spines['left'].set_visible(False)
        self.ax.spines['bottom'].set_color('#555555')
        self.ax.tick_params(axis='x', colors='white', labelsize=9)
        self.ax.tick_params(axis='y', colors='#888888', labelsize=8, length=0)
        self.ax.grid(axis='y', color='#444444', linestyle='--', linewidth=0.5, alpha=0.5)
        
        self.canvas = FigureCanvasTkAgg(self.fig, master=self.graph_container)
        self.canvas.draw()
        self.canvas.get_tk_widget().pack(side="bottom", fill="both", expand=True,
                                          padx=10, pady=10)
    
    # =========================================================================
    # MAIN LOOP
    # =========================================================================
    
    def _loop_leitura(self):
        """Main reading loop."""
        if not self.app_rodando:
            return
        
        deve_ler = (not self.pausar_leitura) and (self.check_flash.get() == 0 or self.luz_ligada)
        
        if deve_ler and self.ser and self.ser.in_waiting:
            try:
                line = self.ser.readline().decode('latin-1').strip()
                vals = line.split(',')
                if len(vals) >= 10:
                    raw = [float(v) if v.replace('.', '', 1).isdigit() else 0 for v in vals[:10]]
                    self.ultimo_raw = list(raw)
                    self.dados_grafico = self._aplicar_tara(raw)
                    self._realizar_predicao(raw)
                    self._atualizar_barras_grafico()
                    
                    if self.ser.in_waiting > 200:
                        self.ser.reset_input_buffer()
            except:
                print(traceback.format_exc())
        
        self.after(50, self._loop_leitura)
    
    def _on_closing(self):
        """Handle window close."""
        self.app_rodando = False
        self._enviar_cmd('0')
        if self.ser:
            self.ser.close()
        self.quit()
        self.destroy()


if __name__ == "__main__":
    app = SmartHiveApp()
    app.mainloop()
