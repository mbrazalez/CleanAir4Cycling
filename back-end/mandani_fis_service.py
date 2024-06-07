import numpy as np
import skfuzzy as fuzz
from skfuzzy import control as ctrl

# Crear las variables del universo y las funciones de membresía
pm10 = ctrl.Antecedent(np.arange(0, 10, 1), 'pm10')
pm25 = ctrl.Antecedent(np.arange(0, 10, 1), 'pm25')
humidity = ctrl.Antecedent(np.arange(0, 100, 1), 'humidity')
pass_quality = ctrl.Consequent(np.arange(0, 10, 1), 'pass_quality')

# Definir las funciones de membresía para cada input y output
pm10['low'] = fuzz.trapmf(pm10.universe, [-2, 0, 3, 4])
pm10['medium'] = fuzz.trapmf(pm10.universe, [3, 4, 6, 7])
pm10['high'] = fuzz.trapmf(pm10.universe, [6, 7, 10, 12])

pm25['low'] = fuzz.trapmf(pm25.universe, [-2, 0, 3, 4])
pm25['medium'] = fuzz.trapmf(pm25.universe, [3, 4, 6, 7])
pm25['high'] = fuzz.trapmf(pm25.universe, [6, 7, 10, 12])

humidity['low'] = fuzz.trapmf(humidity.universe, [-20, 0, 35, 45])
humidity['medium'] = fuzz.trapmf(humidity.universe, [35, 45, 85, 95])
humidity['high'] = fuzz.trapmf(humidity.universe, [85, 95, 100, 120])

pass_quality['close'] = fuzz.trapmf(pass_quality.universe, [-2, 0, 3, 4])
pass_quality['precaution'] = fuzz.trapmf(pass_quality.universe, [3, 4, 6, 7])
pass_quality['open'] = fuzz.trapmf(pass_quality.universe, [6, 7, 10, 12])

# Reglas del sistema
rule1 = ctrl.Rule(antecedent=pm10['low'] & pm25['low'] & ~humidity['high'], consequent=pass_quality['open'], label='rule1')
rule2 = ctrl.Rule(antecedent=pm10['low'] & pm25['medium'] & ~humidity['high'], consequent=pass_quality['open'], label='rule2')
rule3 = ctrl.Rule(antecedent=pm10['medium'] & pm25['low'] & ~humidity['high'], consequent=pass_quality['open'], label='rule3')
rule4 = ctrl.Rule(antecedent=pm10['medium'] & pm25['medium'] & ~humidity['high'], consequent=pass_quality['precaution'], label='rule4')
rule5 = ctrl.Rule(antecedent=pm10['high'] | pm25['high'] | humidity['high'], consequent=pass_quality['close'], label='rule5')

fis_results = {"infoA3A5":0, "infoA2A4":0, "infoA2A3":0, "infoA1A2":0, "infoA1A6":0, "infoA3A6":0, "infoA6A10":0, "infoA6A7":0, 
               "infoA9A10":0, "infoA7A9":0, "infoA8A9":0, "infoA7A8":0, "infoA5A7":0, "infoA4A8":0, "infoA4A5":0}

# Crear y simular el sistema de control
pass_ctrl = ctrl.ControlSystem(rules=[rule1, rule2, rule3, rule4, rule5])
pass_sys = ctrl.ControlSystemSimulation(pass_ctrl)

def process_fis_data(data):
    pass_sys.input['pm10'] = normalize_pm10(data['avgPM10'])
    pass_sys.input['pm25'] = normalize_pm25(data['avgPM25'])
    pass_sys.input['humidity'] = data['avgHumidity']
    pass_sys.compute()
    fis_results[data['stationId']] = round(pass_sys.output["pass_quality"], 2)
    return {data['stationId']: round(pass_sys.output["pass_quality"], 2)}

def normalize_pm10(value: float) -> float:
    return min((value * 10) / 150, 10)

def normalize_pm25(value: float) -> float:
    return min((value * 10) / 35, 10)