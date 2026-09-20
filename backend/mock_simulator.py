"""
DEPRECATED / REMOVED MODULE.
NIRIKSHA IoT platform operates exclusively via physical Serial COM and industrial MQTT protocols.
Synthetic mock simulation has been permanently removed in compliance with production standards.
"""

class MockSimulator:
    def __init__(self):
        raise NotImplementedError(
            "Mock simulation is deprecated and removed. "
            "Please stream physical telemetry via Serial COM or connect to an MQTT broker."
        )
